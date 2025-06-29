--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_Jobs_customerDecision; Type: TYPE; Schema: public; Owner: mc_admin
--

CREATE TYPE public."enum_Jobs_customerDecision" AS ENUM (
    'waiting',
    'accepted',
    'rejected',
    'pending_payment'
);


ALTER TYPE public."enum_Jobs_customerDecision" OWNER TO mc_admin;

--
-- Name: enum_Jobs_finalDecision; Type: TYPE; Schema: public; Owner: mc_admin
--

CREATE TYPE public."enum_Jobs_finalDecision" AS ENUM (
    'yes',
    'no',
    'customer_selected'
);


ALTER TYPE public."enum_Jobs_finalDecision" OWNER TO mc_admin;

--
-- Name: enum_Jobs_quoteStatus; Type: TYPE; Schema: public; Owner: mc_admin
--

CREATE TYPE public."enum_Jobs_quoteStatus" AS ENUM (
    'no_quotes',
    'quoted',
    'actioned',
    'approved'
);


ALTER TYPE public."enum_Jobs_quoteStatus" OWNER TO mc_admin;

--
-- Name: enum_Jobs_status; Type: TYPE; Schema: public; Owner: mc_admin
--

CREATE TYPE public."enum_Jobs_status" AS ENUM (
    'pending',
    'approved',
    'allocated',
    'completed',
    'rejected',
    'archived',
    'deleted',
    'quoted',
    'paid',
    'processed',
    'waiting_customer_selection'
);


ALTER TYPE public."enum_Jobs_status" OWNER TO mc_admin;

--
-- Name: enum_Quotes_status; Type: TYPE; Schema: public; Owner: mc_admin
--

CREATE TYPE public."enum_Quotes_status" AS ENUM (
    'pending',
    'won',
    'lost',
    'under_review',
    'expired'
);


ALTER TYPE public."enum_Quotes_status" OWNER TO mc_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Bodyshops; Type: TABLE; Schema: public; Owner: mc_admin
--

CREATE TABLE public."Bodyshops" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    area character varying(255) NOT NULL,
    "verificationToken" character varying(255),
    verified boolean DEFAULT false NOT NULL,
    "resetToken" character varying(255),
    "resetTokenExpiry" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "lastReminderSent" timestamp with time zone,
    phone character varying(255),
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    "subscriptionStatus" character varying(255) DEFAULT 'trial'::character varying NOT NULL,
    "subscriptionType" character varying(255) DEFAULT 'free'::character varying NOT NULL,
    "subscriptionEndsAt" timestamp with time zone
);


ALTER TABLE public."Bodyshops" OWNER TO mc_admin;

--
-- Name: Bodyshops_id_seq; Type: SEQUENCE; Schema: public; Owner: mc_admin
--

CREATE SEQUENCE public."Bodyshops_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bodyshops_id_seq" OWNER TO mc_admin;

--
-- Name: Bodyshops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mc_admin
--

ALTER SEQUENCE public."Bodyshops_id_seq" OWNED BY public."Bodyshops".id;


--
-- Name: DeletedJobs; Type: TABLE; Schema: public; Owner: mc_admin
--

CREATE TABLE public."DeletedJobs" (
    id integer NOT NULL,
    "jobId" integer,
    "customerName" character varying(255),
    "customerEmail" character varying(255),
    location character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."DeletedJobs" OWNER TO mc_admin;

--
-- Name: DeletedJobs_id_seq; Type: SEQUENCE; Schema: public; Owner: mc_admin
--

CREATE SEQUENCE public."DeletedJobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DeletedJobs_id_seq" OWNER TO mc_admin;

--
-- Name: DeletedJobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mc_admin
--

ALTER SEQUENCE public."DeletedJobs_id_seq" OWNED BY public."DeletedJobs".id;


--
-- Name: Jobs; Type: TABLE; Schema: public; Owner: mc_admin
--

CREATE TABLE public."Jobs" (
    id integer NOT NULL,
    "customerName" character varying(255) NOT NULL,
    "customerEmail" character varying(255) NOT NULL,
    "customerPhone" character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    latitude double precision,
    longitude double precision,
    images text NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    "selectedBodyshopId" integer,
    paid boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "lastActionDate" timestamp with time zone,
    viewed boolean DEFAULT false,
    "quoteStatus" public."enum_Jobs_quoteStatus" DEFAULT 'no_quotes'::public."enum_Jobs_quoteStatus" NOT NULL,
    "daysPending" integer DEFAULT 0 NOT NULL,
    radius double precision DEFAULT '10'::double precision,
    "quoteExpiry" timestamp with time zone DEFAULT (now() + '48:00:00'::interval),
    extended boolean DEFAULT false,
    "extensionRequestedAt" timestamp with time zone,
    "quoteCount" integer DEFAULT 0,
    "extensionCount" integer DEFAULT 0,
    "customerDecision" public."enum_Jobs_customerDecision" DEFAULT 'waiting'::public."enum_Jobs_customerDecision",
    "emailSentAt" timestamp with time zone,
    "cancelToken" character varying(255),
    "extendToken" character varying(255),
    "extendTokenUsed" boolean DEFAULT false,
    "cancelTokenUsed" boolean DEFAULT false,
    "selectedQuoteId" integer
);


ALTER TABLE public."Jobs" OWNER TO mc_admin;

--
-- Name: Jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: mc_admin
--

CREATE SEQUENCE public."Jobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Jobs_id_seq" OWNER TO mc_admin;

--
-- Name: Jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mc_admin
--

ALTER SEQUENCE public."Jobs_id_seq" OWNED BY public."Jobs".id;


--
-- Name: Quotes; Type: TABLE; Schema: public; Owner: mc_admin
--

CREATE TABLE public."Quotes" (
    id integer NOT NULL,
    "bodyshopId" integer NOT NULL,
    "jobId" integer NOT NULL,
    price double precision NOT NULL,
    notes text,
    email character varying(255) NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    viewed boolean DEFAULT false NOT NULL,
    actioned boolean DEFAULT false NOT NULL,
    "lastActionDate" timestamp with time zone,
    status public."enum_Quotes_status" DEFAULT 'pending'::public."enum_Quotes_status" NOT NULL
);


ALTER TABLE public."Quotes" OWNER TO mc_admin;

--
-- Name: Quotes_id_seq; Type: SEQUENCE; Schema: public; Owner: mc_admin
--

CREATE SEQUENCE public."Quotes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Quotes_id_seq" OWNER TO mc_admin;

--
-- Name: Quotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: mc_admin
--

ALTER SEQUENCE public."Quotes_id_seq" OWNED BY public."Quotes".id;


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: mc_admin
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO mc_admin;

--
-- Name: session; Type: TABLE; Schema: public; Owner: mc_admin
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO mc_admin;

--
-- Name: Bodyshops id; Type: DEFAULT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Bodyshops" ALTER COLUMN id SET DEFAULT nextval('public."Bodyshops_id_seq"'::regclass);


--
-- Name: DeletedJobs id; Type: DEFAULT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."DeletedJobs" ALTER COLUMN id SET DEFAULT nextval('public."DeletedJobs_id_seq"'::regclass);


--
-- Name: Jobs id; Type: DEFAULT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Jobs" ALTER COLUMN id SET DEFAULT nextval('public."Jobs_id_seq"'::regclass);


--
-- Name: Quotes id; Type: DEFAULT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Quotes" ALTER COLUMN id SET DEFAULT nextval('public."Quotes_id_seq"'::regclass);


--
-- Name: Bodyshops Bodyshops_email_key; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Bodyshops"
    ADD CONSTRAINT "Bodyshops_email_key" UNIQUE (email);


--
-- Name: Bodyshops Bodyshops_phone_key; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Bodyshops"
    ADD CONSTRAINT "Bodyshops_phone_key" UNIQUE (phone);


--
-- Name: Bodyshops Bodyshops_pkey; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Bodyshops"
    ADD CONSTRAINT "Bodyshops_pkey" PRIMARY KEY (id);


--
-- Name: DeletedJobs DeletedJobs_pkey; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."DeletedJobs"
    ADD CONSTRAINT "DeletedJobs_pkey" PRIMARY KEY (id);


--
-- Name: Jobs Jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Jobs"
    ADD CONSTRAINT "Jobs_pkey" PRIMARY KEY (id);


--
-- Name: Quotes Quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Quotes"
    ADD CONSTRAINT "Quotes_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: mc_admin
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: Jobs Jobs_selectedBodyshopId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Jobs"
    ADD CONSTRAINT "Jobs_selectedBodyshopId_fkey" FOREIGN KEY ("selectedBodyshopId") REFERENCES public."Bodyshops"(id);


--
-- Name: Quotes Quotes_bodyshopId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Quotes"
    ADD CONSTRAINT "Quotes_bodyshopId_fkey" FOREIGN KEY ("bodyshopId") REFERENCES public."Bodyshops"(id) ON DELETE CASCADE;


--
-- Name: Quotes Quotes_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: mc_admin
--

ALTER TABLE ONLY public."Quotes"
    ADD CONSTRAINT "Quotes_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Jobs"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

