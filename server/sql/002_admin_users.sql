USE CanalDenuncia;
GO

IF OBJECT_ID(N'dbo.admin_users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.admin_users (
    id            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_admin_users PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    email         NVARCHAR(200)    NOT NULL,
    name          NVARCHAR(200)    NOT NULL,
    password_hash NVARCHAR(200)    NOT NULL,
    role          NVARCHAR(40)     NOT NULL CONSTRAINT DF_admin_users_role DEFAULT (N'rh'),
    is_active     BIT              NOT NULL CONSTRAINT DF_admin_users_active DEFAULT (1),
    created_at    DATETIME2(0)     NOT NULL CONSTRAINT DF_admin_users_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_admin_users_email UNIQUE (email),
    CONSTRAINT CK_admin_users_role CHECK (role IN (N'rh', N'diretoria'))
  );

  CREATE INDEX IX_admin_users_email ON dbo.admin_users (email);
END
GO

IF OBJECT_ID(N'dbo.report_events', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.report_events (
    id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_report_events PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    report_id   UNIQUEIDENTIFIER NOT NULL,
    actor_id    UNIQUEIDENTIFIER NULL,
    actor_email NVARCHAR(200)    NULL,
    event_type  NVARCHAR(60)     NOT NULL,
    from_status NVARCHAR(40)     NULL,
    to_status   NVARCHAR(40)     NULL,
    note        NVARCHAR(MAX)    NULL,
    created_at  DATETIME2(0)     NOT NULL CONSTRAINT DF_report_events_created DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_report_events_reports FOREIGN KEY (report_id)
      REFERENCES dbo.reports (id) ON DELETE CASCADE
  );

  CREATE INDEX IX_report_events_report_id ON dbo.report_events (report_id, created_at DESC);
END
GO
