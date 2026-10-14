-- Firebase Authentication identity for USERS. PASSWORD_HASH is kept but no longer used
-- (passwords live in Firebase).

ALTER TABLE dbo.USERS ADD
    FIREBASE_UID  VARCHAR(128) NULL,
    [ROLE]        VARCHAR(20)  NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'student',
    LAST_LOGIN_AT DATETIME2    NULL;
GO

ALTER TABLE dbo.USERS ADD CONSTRAINT CK_Users_Role CHECK ([ROLE] IN ('student', 'moderator', 'admin'));
GO

-- Filtered: a plain UNIQUE constraint would allow only one pre-existing row with a NULL uid.
CREATE UNIQUE INDEX UX_Users_FirebaseUid ON dbo.USERS (FIREBASE_UID) WHERE FIREBASE_UID IS NOT NULL;
GO

EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'Deprecated: unused, credentials are managed by Firebase Authentication.',
    @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'USERS',
    @level2type = N'COLUMN', @level2name = N'PASSWORD_HASH';
GO
