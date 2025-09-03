-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cmr_documents (
  filename text NOT NULL UNIQUE,
  document_date date,
  ocr_confidence numeric CHECK (ocr_confidence >= 0::numeric AND ocr_confidence <= 1::numeric),
  error_message text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  processing_date timestamp without time zone DEFAULT now(),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'low_quality'::text])),
  source text DEFAULT 'new'::text,
  cost_gemini numeric DEFAULT 0,
  api_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  unitary_usage_serpapi numeric DEFAULT 0,
  unitary_usage_hunter numeric DEFAULT 0,
  unitary_usage_firecrawl numeric DEFAULT 0,
  CONSTRAINT cmr_documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.companies (
  empresa text NOT NULL,
  direccion text,
  telefono text,
  email text,
  website text,
  role text CHECK (role = ANY (ARRAY['expedidor'::text, 'destinatario'::text, 'transportista'::text])),
  tipo_camion text,
  vehiculo text,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_seen date DEFAULT CURRENT_DATE,
  times_seen integer DEFAULT 1,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  tax_id text DEFAULT ''::text,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.document_companies (
  document_id uuid UNIQUE,
  expedidor_id uuid,
  destinatario_id uuid,
  transportista_id uuid,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  CONSTRAINT document_companies_pkey PRIMARY KEY (id),
  CONSTRAINT document_companies_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.companies(id),
  CONSTRAINT document_companies_transportista_id_fkey FOREIGN KEY (transportista_id) REFERENCES public.companies(id),
  CONSTRAINT document_companies_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.cmr_documents(id),
  CONSTRAINT document_companies_expedidor_id_fkey FOREIGN KEY (expedidor_id) REFERENCES public.companies(id)
);