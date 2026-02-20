# Gestão de Vendas - Desafio Técnico Excellent Sistemas

Este projeto é uma aplicação Full Stack robusta para gestão de produtos, clientes e realização de vendas, desenvolvida como parte do teste técnico para a **Excellent Sistemas**.

A solução foca em **integridade de dados**, **UX fluida** e uma infraestrutura **"Plug and Play"** totalmente containerizada.

## Como Rodar o Projeto (Docker)

A forma mais simples e recomendada de executar a aplicação é utilizando o **Docker**. Isso garante que o banco de dados PostgreSQL, a API NestJS e o Frontend Angular subam automaticamente com todas as configurações de rede e volumes prontas.

### Pré-requisitos

- **Docker** e **Docker Compose** instalados.

### Passo a Passo

1.  **Clone o repositório:**

    ```bash
    git clone [https://github.com/SchusterN-hub/teste-tecnico-excellent-sistemas.git](https://github.com/SchusterN-hub/teste-tecnico-excellent-sistemas.git)
    ```

2.  **Execute o comando de build e inicialização na raiz do projeto:**

    ```bash
    docker-compose up --build
    ```

3.  **Acesse o sistema:**
    - **Frontend (Aplicação):** [http://localhost:4200](http://localhost:4200)
    - **Documentação da API(Swagger):** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Tecnologias Utilizadas

### Backend (API)

- **Node.js 20 & NestJS:** Framework progressivo para construção de aplicações eficientes e escaláveis.
- **TypeORM:** ORM moderno para integração com o banco de dados.
- **PostgreSQL:** Banco de dados relacional robusto para persistência de dados.
- **JWT & Passport:** Sistema de autenticação e proteção de rotas por perfis (Admin/User).
- **Multer:** Gerenciamento de upload de arquivos para imagens de produtos.

### Frontend (Web)

- **Angular 19:** Versão mais recente do framework, utilizando _standalone components_.
- **Angular Material:** Biblioteca de componentes de UI de alta qualidade.
- **TypeScript:** Tipagem estática para desenvolvimento seguro.
- **Ngx-mask:** Formatação dinâmica de campos como moeda e CNPJ.

### DevOps & Infra

- **Docker Multi-Stage Build:** Separação entre build e runtime para gerar imagens leves.
- **Nginx:** Servidor de alta performance para entrega do bundle estático do Angular.

## Decisões Técnicas

### 1. Atomicidade em Vendas

Diferente de um CRUD simples, a criação de pedidos utiliza **transações de banco de dados** via `dataSource.transaction`.

- **O motivo:** Garante que a baixa de estoque do produto e a criação do registro de venda ocorram juntas. Se houver erro, o sistema realiza um _rollback_ automático.

### 2. Paginação em Nível de Banco

A listagem de produtos implementa paginação real via `findAndCount`.

- **O motivo:** Evita o carregamento desnecessário de milhares de registros na memória do navegador, processando os limites diretamente na query SQL.

### 3. Persistência de Imagens

Utilização de **Volumes do Docker** para a pasta `/uploads` e para o banco de dados.

- **O motivo:** Garante que os dados cadastrados não sejam perdidas caso o container da API seja reiniciado.

### 4. Resiliência de Infraestrutura

Configuração de **Retry Logic** na conexão com o banco de dados.

- **O motivo:** Como o NestJS sobe mais rápido que o PostgreSQL no Docker, a API tenta reconectar automaticamente até que o banco esteja pronto.

## Funcionalidades

- **Autenticação:** Login seguro com controle de acesso baseado em roles (Admin/User).
- **Gestão de Produtos:** CRUD completo com upload de imagens, edição e paginação.
- **Baixa Automática:** Subtração de estoque no momento da finalização do pedido.
- **Histórico de Pedidos:** Listagem detalhada de vendas realizadas com relações de itens.

## Usuários de Teste

| Perfil            | E-mail            | Senha    |
| :---------------- | :---------------- | :------- |
| **Administrador** | `admin@admin.com` | `123456` |

Desenvolvido por **Nicolas Schuster**
