USE CanalDenuncia;
GO

IF COL_LENGTH(N'dbo.attachments', N'is_internal') IS NULL
BEGIN
  ALTER TABLE dbo.attachments
    ADD is_internal BIT NOT NULL
      CONSTRAINT DF_attachments_is_internal DEFAULT (0);
END
GO
