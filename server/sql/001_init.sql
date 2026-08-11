-- Canal de Denúncia Só Aço — tabelas (SQL Server Express)
-- O banco CanalDenuncia (arquivos .mdf/.ldf) é criado pelo migrate.js.

USE CanalDenuncia;
GO

IF OBJECT_ID(N'dbo.reports', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.reports (
    id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_reports PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    protocol         NVARCHAR(20)     NOT NULL,
    type             NVARCHAR(50)     NOT NULL,
    description      NVARCHAR(MAX)    NOT NULL,
    occurred_at      NVARCHAR(100)    NOT NULL,
    location         NVARCHAR(500)    NOT NULL,
    involved         NVARCHAR(MAX)    NULL,
    is_anonymous     BIT              NOT NULL CONSTRAINT DF_reports_anonymous DEFAULT (1),
    contact_name     NVARCHAR(200)    NULL,
    contact_email    NVARCHAR(200)    NULL,
    contact_phone    NVARCHAR(50)     NULL,
    status           NVARCHAR(40)     NOT NULL CONSTRAINT DF_reports_status DEFAULT (N'recebida'),
    created_at       DATETIME2(0)     NOT NULL CONSTRAINT DF_reports_created DEFAULT (SYSUTCDATETIME()),
    updated_at       DATETIME2(0)     NOT NULL CONSTRAINT DF_reports_updated DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_reports_protocol UNIQUE (protocol)
  );

  CREATE INDEX IX_reports_status ON dbo.reports (status);
  CREATE INDEX IX_reports_created_at ON dbo.reports (created_at DESC);
END
GO

IF OBJECT_ID(N'dbo.attachments', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.attachments (
    id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_attachments PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    report_id        UNIQUEIDENTIFIER NOT NULL,
    original_name    NVARCHAR(260)    NOT NULL,
    stored_name      NVARCHAR(260)    NOT NULL,
    mime_type        NVARCHAR(120)    NULL,
    size_bytes       BIGINT           NOT NULL CONSTRAINT DF_attachments_size DEFAULT (0),
    is_internal      BIT              NOT NULL CONSTRAINT DF_attachments_is_internal DEFAULT (0),
    created_at       DATETIME2(0)     NOT NULL CONSTRAINT DF_attachments_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_attachments_reports FOREIGN KEY (report_id)
      REFERENCES dbo.reports (id) ON DELETE CASCADE
  );

  CREATE INDEX IX_attachments_report_id ON dbo.attachments (report_id);
END
GO
