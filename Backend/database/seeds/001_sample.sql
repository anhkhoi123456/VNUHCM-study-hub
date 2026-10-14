-- Sample data mirroring Frontend/js/data/*.js (UIT > HTTT > CTTT > CTDL).
-- Idempotent: re-running updates descriptive columns but keeps DOCUMENT.VIEWS.
-- NB: sizes belong to the placeholder files in storage/samples/ (see Backend/README.md).

MERGE dbo.UNIVERSITIES AS t USING (VALUES
  ('UIT',   N'Trường Đại học Công nghệ Thông tin',               'resources/Logo/UIT.webp'),
  ('HCMUS', N'Trường Đại học Khoa học Tự nhiên',                 'resources/Logo/US.webp'),
  ('HCMUT', N'Trường Đại học Bách khoa',                         'resources/Logo/BK.webp'),
  ('UEL',   N'Trường Đại học Kinh tế – Luật',                    'resources/Logo/UEL.webp'),
  ('IU',    N'Trường Đại học Quốc tế',                           'resources/Logo/IU.webp'),
  ('USSH',  N'Trường Đại học Khoa học Xã hội và Nhân văn',       'resources/Logo/USSH.webp'),
  ('UHS',   N'Trường Đại học Khoa học Sức khỏe',                 'resources/Logo/SK.webp'),
  ('AGU',   N'Trường Đại học An Giang',                          NULL)
) AS s (id, name, logo) ON t.UNIVERSITY_ID = s.id
WHEN MATCHED THEN UPDATE SET NAME = s.name, LOGO_PATH = s.logo
WHEN NOT MATCHED THEN INSERT (UNIVERSITY_ID, NAME, LOGO_PATH) VALUES (s.id, s.name, s.logo);
GO

MERGE dbo.FACULTY AS t USING (VALUES
  ('ktmt',  N'Kỹ thuật máy tính',                   'theme-blue',   'fa-solid fa-code'),
  ('httt',  N'Hệ thống thông tin',                  'theme-purple', 'fa-solid fa-sitemap'),
  ('cnpm',  N'Công nghệ phần mềm',                  'theme-green',  'fa-solid fa-gears'),
  ('khmt',  N'Khoa học máy tính',                   'theme-yellow', 'fa-solid fa-database'),
  ('mmtt',  N'Mạng máy tính và truyền thông',       'theme-pink',   'fa-solid fa-tower-broadcast'),
  ('khktt', N'Khoa học và Kỹ thuật Thông tin',      'theme-orange', 'fa-solid fa-microchip')
) AS s (id, name, theme, icon) ON t.FACULTY_ID = s.id
WHEN MATCHED THEN UPDATE SET NAME = s.name, THEME = s.theme, ICON = s.icon
WHEN NOT MATCHED THEN INSERT (FACULTY_ID, NAME, THEME, ICON) VALUES (s.id, s.name, s.theme, s.icon);
GO

MERGE dbo.FACULTY_CONTAINER AS t USING (VALUES
  ('UIT','ktmt'), ('UIT','httt'), ('UIT','cnpm'), ('UIT','khmt'), ('UIT','mmtt'), ('UIT','khktt')
) AS s (u, f) ON t.UNIVERSITY_ID = s.u AND t.FACULTY_ID = s.f
WHEN NOT MATCHED THEN INSERT (UNIVERSITY_ID, FACULTY_ID) VALUES (s.u, s.f);
GO

MERGE dbo.MAJOR AS t USING (VALUES
  ('httt-dai-tra', N'Hệ thống thông tin (Đại trà)', 'theme-blue',   'fa-solid fa-circle-question'),
  ('httt-cttt',    N'Hệ thống thông tin (CTTT)',    'theme-purple', 'fa-solid fa-computer'),
  ('tmdt',         N'Thương mại điện tử',           'theme-orange', 'fa-solid fa-cart-shopping')
) AS s (id, name, theme, icon) ON t.MAJOR_ID = s.id
WHEN MATCHED THEN UPDATE SET NAME = s.name, THEME = s.theme, ICON = s.icon
WHEN NOT MATCHED THEN INSERT (MAJOR_ID, NAME, THEME, ICON) VALUES (s.id, s.name, s.theme, s.icon);
GO

MERGE dbo.MAJOR_CONTAINER AS t USING (VALUES
  ('httt','httt-dai-tra'), ('httt','httt-cttt'), ('httt','tmdt')
) AS s (f, m) ON t.FACULTY_ID = s.f AND t.MAJOR_ID = s.m
WHEN NOT MATCHED THEN INSERT (FACULTY_ID, MAJOR_ID) VALUES (s.f, s.m);
GO

MERGE dbo.COURSE AS t USING (VALUES
  ('giai-tich',            N'Giải tích',                      '1', 'dai-cuong', N'Nguyễn Văn A',  '2024-06-20', 'blue'),
  ('dai-so-tuyen-tinh',    N'Đại số tuyến tính',              '1', 'dai-cuong', N'Trần Thị Bảo',  '2024-06-15', 'purple'),
  ('tu-tuong-ho-chi-minh', N'Tư tưởng Hồ Chí Minh',           '2', 'dai-cuong', N'Phạm Minh Đức', '2024-06-10', 'red'),
  ('he-dieu-hanh',         N'Hệ điều hành',                   '2', 'co-so',     N'Lê Hoàng Nam',  '2024-06-08', 'green'),
  ('ctdl',                 N'Cấu trúc dữ liệu và giải thuật', '2', 'co-so',     N'Nguyễn Văn Hùng','2024-06-20', 'pink'),
  ('nhap-mon-lap-trinh',   N'Nhập môn lập trình',             '1', 'co-so',     N'Nguyễn Văn A',  '2024-05-25', 'yellow')
) AS s (id, name, sem, type, lecturer, updated, color) ON t.COURSE_ID = s.id
WHEN MATCHED THEN UPDATE SET NAME = s.name, SEMESTER = s.sem, COURSE_TYPE = s.type,
                             LECTURER = s.lecturer, UPDATED = s.updated, COLOR = s.color
WHEN NOT MATCHED THEN INSERT (COURSE_ID, NAME, SEMESTER, COURSE_TYPE, LECTURER, UPDATED, COLOR)
  VALUES (s.id, s.name, s.sem, s.type, s.lecturer, s.updated, s.color);
GO

MERGE dbo.COURSE_CONTAINER AS t USING (VALUES
  ('httt-cttt','giai-tich'), ('httt-cttt','dai-so-tuyen-tinh'), ('httt-cttt','tu-tuong-ho-chi-minh'),
  ('httt-cttt','he-dieu-hanh'), ('httt-cttt','ctdl'), ('httt-cttt','nhap-mon-lap-trinh')
) AS s (m, c) ON t.MAJOR_ID = s.m AND t.COURSE_ID = s.c
WHEN NOT MATCHED THEN INSERT (MAJOR_ID, COURSE_ID) VALUES (s.m, s.c);
GO

MERGE dbo.DOCUMENT AS t USING (VALUES
  ('ctdl-master', 'ctdl', N'Tài liệu tổng hợp - Cấu trúc dữ liệu và giải thuật',
   N'Tổng hợp toàn bộ lý thuyết, ví dụ, bài tập và hướng dẫn giải.',
   'PDF', 'application/pdf', N'Nguyễn Văn Hùng', '2024-06-20', 2962, 1200, 1,
   'samples/ctdl-master.pdf', NULL),
  ('ctdl-slides', 'ctdl', N'Slide bài giảng - Cấu trúc dữ liệu và giải thuật',
   N'Slide trình chiếu các nội dung chính của môn học.',
   'PPTX', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
   N'Nguyễn Văn Hùng', '2024-06-18', 30113, 892, 0,
   'samples/ctdl-slides.pptx', 'samples/ctdl-slides.pdf')
) AS s (id, course, title, descr, type, mime, lecturer, updated, size, views, master, file_path, preview_path)
ON t.DOCUMENT_ID = s.id
WHEN MATCHED THEN UPDATE SET COURSE_ID = s.course, TITLE = s.title, [DESCRIPTION] = s.descr, [TYPE] = s.type,
    MIME_TYPE = s.mime, LECTURER = s.lecturer, UPDATED = s.updated, SIZE_BYTES = s.size,
    IS_MASTER = s.master, FILE_PATH = s.file_path, PREVIEW_PATH = s.preview_path
WHEN NOT MATCHED THEN INSERT (DOCUMENT_ID, COURSE_ID, TITLE, [DESCRIPTION], [TYPE], MIME_TYPE, LECTURER,
    UPDATED, SIZE_BYTES, [VIEWS], IS_MASTER, FILE_PATH, PREVIEW_PATH)
  VALUES (s.id, s.course, s.title, s.descr, s.type, s.mime, s.lecturer, s.updated, s.size, s.views, s.master,
    s.file_path, s.preview_path);
GO
