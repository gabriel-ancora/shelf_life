-- Tabelas do Churras Express PWA

-- 1. Produtos
CREATE TABLE public.produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tempo_validade_horas INTEGER NOT NULL, -- ex: 72 horas para 3 dias
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Locais
CREATE TABLE public.locais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL, -- ex: Geladeira, Estante, Freezer
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Lotes (Etiquetas / Potes)
CREATE TABLE public.lotes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    numero_pote VARCHAR(50) NOT NULL,
    local_id INTEGER REFERENCES public.locais(id) ON DELETE SET NULL,
    data_fabricacao TIMESTAMP WITH TIME ZONE NOT NULL,
    data_validade TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'consumido', 'descartado')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mock Data Inicial
INSERT INTO public.produtos (nome, tempo_validade_horas) VALUES
('Maionese Temperada', 72),
('Vinagrete', 48),
('Carne Pré-Assada', 120);

INSERT INTO public.locais (nome) VALUES
('Geladeira 1'),
('Geladeira 2'),
('Estante Secos'),
('Freezer');
