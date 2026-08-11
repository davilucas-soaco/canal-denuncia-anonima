USE CanalDenuncia;
GO

IF OBJECT_ID(N'dbo.email_provider_settings', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.email_provider_settings (
    id                       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_email_provider_settings PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    provider                 NVARCHAR(40)     NOT NULL CONSTRAINT DF_email_provider DEFAULT (N'gmail_api'),
    from_email               NVARCHAR(200)    NOT NULL,
    from_name                NVARCHAR(200)    NOT NULL,
    client_id                NVARCHAR(500)    NOT NULL,
    client_secret_encrypted  NVARCHAR(MAX)    NOT NULL,
    refresh_token_encrypted  NVARCHAR(MAX)    NOT NULL,
    notify_to                NVARCHAR(1000)   NULL,
    last_tested_at           DATETIME2(0)     NULL,
    last_error               NVARCHAR(2000)   NULL,
    credential_blocked_at    DATETIME2(0)     NULL,
    credential_block_code    NVARCHAR(80)     NULL,
    credential_block_summary NVARCHAR(500)    NULL,
    created_at               DATETIME2(0)     NOT NULL CONSTRAINT DF_email_provider_created DEFAULT (SYSUTCDATETIME()),
    updated_at               DATETIME2(0)     NOT NULL CONSTRAINT DF_email_provider_updated DEFAULT (SYSUTCDATETIME())
  );
END
GO
