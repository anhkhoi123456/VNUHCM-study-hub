/** Sample catalog data. Add entries here without duplicating card markup. */
window.StudyHubCatalog = {
  "schools": [
    {
      "id": "UIT",
      "name": "Trường Đại học Công nghệ Thông tin",
      "image": "../resources/Logo/UIT.webp",
      "href": "uit-faculties.html"
    },
    {
      "id": "HCMUS",
      "name": "Trường Đại học Khoa học Tự nhiên",
      "image": "../resources/Logo/US.webp",
      "href": null
    },
    {
      "id": "HCMUT",
      "name": "Trường Đại học Bách khoa",
      "image": "../resources/Logo/BK.webp",
      "href": null
    },
    {
      "id": "UEL",
      "name": "Trường Đại học Kinh tế – Luật",
      "image": "../resources/Logo/UEL.webp",
      "href": null
    },
    {
      "id": "IU",
      "name": "Trường Đại học Quốc tế",
      "image": "../resources/Logo/IU.webp",
      "href": null
    },
    {
      "id": "USSH",
      "name": "Trường Đại học Khoa học Xã hội và Nhân văn",
      "image": "../resources/Logo/USSH.webp",
      "href": null
    },
    {
      "id": "UHS",
      "name": "Trường Đại học Khoa học Sức khỏe",
      "image": "../resources/Logo/SK.webp",
      "href": null
    },
    {
      "id": "AGU",
      "name": "Trường Đại học An Giang",
      "image": "../resources/Logo/logo-truong-dai-hoc-an-giang-inkythuatso.svg",
      "href": null
    }
  ],
  "faculties": [
    {
      "name": "Kỹ thuật máy tính",
      "theme": "theme-blue",
      "href": "library.html?faculty=ky-thuat-may-tinh",
      "icon": "fa-solid fa-code",
      "count": 128
    },
    {
      "name": "Hệ thống thông tin",
      "theme": "theme-purple",
      "href": "uit-is-majors.html",
      "icon": "fa-solid fa-sitemap",
      "count": 96
    },
    {
      "name": "Công nghệ phần mềm",
      "theme": "theme-green",
      "href": "library.html?faculty=cong-nghe-phan-mem",
      "icon": "fa-solid fa-gears",
      "count": 143
    },
    {
      "name": "Khoa học máy tính",
      "theme": "theme-yellow",
      "href": "library.html?faculty=khoa-hoc-may-tinh",
      "icon": "fa-solid fa-database",
      "count": 152
    },
    {
      "name": "Mạng máy tính và truyền thông",
      "theme": "theme-pink",
      "href": "library.html?faculty=mang-may-tinh-va-truyen-thong",
      "icon": "fa-solid fa-tower-broadcast",
      "count": 87
    },
    {
      "name": "Khoa học và Kỹ thuật Thông tin",
      "theme": "theme-orange",
      "href": "library.html?faculty=khoa-hoc-va-ky-thuat-thong-tin",
      "icon": "fa-solid fa-microchip",
      "count": 110
    }
  ],
  "majors": [
    {
      "name": "Hệ thống thông tin (Đại trà)",
      "theme": "theme-blue",
      "href": "library.html?faculty=he-thong-thong-tin&major=he-thong-thong-tin-dai-tra",
      "icon": "fa-solid fa-circle-question",
      "count": 128
    },
    {
      "name": "Hệ thống thông tin (CTTT)",
      "theme": "theme-purple",
      "href": "uit-is-cttt-subjects.html",
      "icon": "fa-solid fa-computer",
      "count": 96
    },
    {
      "name": "Thương mại điện tử",
      "theme": "theme-orange",
      "href": "library.html?faculty=he-thong-thong-tin&major=thuong-mai-dien-tu",
      "icon": "fa-solid fa-cart-shopping",
      "count": 143
    }
  ],
  "subjects": [
    {
      "id": "giai-tich",
      "name": "Giải tích",
      "semester": "1",
      "type": "dai-cuong",
      "lecturer": "Nguyễn Văn A",
      "date": "2024-06-20",
      "color": "blue",
      "count": 245,
      "formats": [
        "PDF",
        "PPTX",
        "DOC"
      ],
      "href": "library.html?subject=giai-tich"
    },
    {
      "id": "dai-so-tuyen-tinh",
      "name": "Đại số tuyến tính",
      "semester": "1",
      "type": "dai-cuong",
      "lecturer": "Trần Thị Bảo",
      "date": "2024-06-15",
      "color": "purple",
      "count": 198,
      "formats": [
        "PDF",
        "PPTX",
        "XLSX"
      ],
      "href": "library.html?subject=dai-so-tuyen-tinh"
    },
    {
      "id": "tu-tuong-ho-chi-minh",
      "name": "Tư tưởng Hồ Chí Minh",
      "semester": "2",
      "type": "dai-cuong",
      "lecturer": "Phạm Minh Đức",
      "date": "2024-06-10",
      "color": "red",
      "count": 112,
      "formats": [
        "PDF",
        "PPTX",
        "DOC"
      ],
      "href": "library.html?subject=tu-tuong-ho-chi-minh"
    },
    {
      "id": "he-dieu-hanh",
      "name": "Hệ điều hành",
      "semester": "2",
      "type": "co-so",
      "lecturer": "Lê Hoàng Nam",
      "date": "2024-06-08",
      "color": "green",
      "count": 176,
      "formats": [
        "PDF",
        "PPTX",
        "DOC",
        "XLSX"
      ],
      "href": "library.html?subject=he-dieu-hanh"
    },
    {
      "id": "ctdl",
      "name": "Cấu trúc dữ liệu và giải thuật",
      "semester": "2",
      "type": "co-so",
      "lecturer": "Nguyễn Văn Hùng",
      "date": "2024-06-20",
      "color": "pink",
      "count": 2,
      "formats": [
        "PDF",
        "PPTX"
      ],
      "href": "dsa.html"
    },
    {
      "id": "nhap-mon-lap-trinh",
      "name": "Nhập môn lập trình",
      "semester": "1",
      "type": "co-so",
      "lecturer": "Nguyễn Văn A",
      "date": "2024-05-25",
      "color": "yellow",
      "count": 289,
      "formats": [
        "PDF",
        "PPTX",
        "DOC",
        "XLSX"
      ],
      "href": "library.html?subject=nhap-mon-lap-trinh"
    }
  ],
  "subjectGroups": {
    "uit-is-cttt": [
      "giai-tich",
      "dai-so-tuyen-tinh",
      "tu-tuong-ho-chi-minh",
      "he-dieu-hanh",
      "ctdl",
      "nhap-mon-lap-trinh"
    ]
  },
  "pages": {
    "faculties": {
      "title": "Đại học Công nghệ Thông tin (UIT)",
      "subtitle": "Chọn khoa để xem danh sách tài liệu",
      "search": "Tìm khoa",
      "empty": "Không tìm thấy khoa phù hợp.",
      "image": "../resources/Logo/UIT.webp",
      "imageAlt": "Logo Đại học Công nghệ Thông tin",
      "items": "faculties",
      "breadcrumbs": [
        {
          "label": "Trang chủ",
          "href": "dashboard.html"
        },
        {
          "label": "ĐHQG TP.HCM"
        },
        {
          "label": "UIT",
          "href": "uit-faculties.html"
        },
        {
          "label": "Khoa"
        }
      ]
    },
    "majors": {
      "title": "Hệ thống thông tin",
      "subtitle": "Chọn ngành để xem danh sách tài liệu",
      "search": "Tìm ngành",
      "empty": "Không tìm thấy ngành phù hợp.",
      "icon": "fa-solid fa-folder-tree",
      "items": "majors",
      "breadcrumbs": [
        {
          "label": "Trang chủ",
          "href": "dashboard.html"
        },
        {
          "label": "ĐHQG TP.HCM"
        },
        {
          "label": "UIT",
          "href": "uit-faculties.html"
        },
        {
          "label": "Khoa",
          "href": "uit-faculties.html"
        },
        {
          "label": "Hệ thống thông tin"
        },
        {
          "label": "Ngành"
        }
      ]
    }
  }
};
