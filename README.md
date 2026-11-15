# 밑줄 먹는 여우

어두운 서재에서 티벳여우가 책을 꺼내 먹고 잠들면, 그 책의 밑줄 친 구절이 꿈속에서 펼쳐지는 독서 아카이브.

## 로컬에서 보기

`data/books.json`을 불러오기 때문에 파일을 더블클릭해서 열면 동작하지 않아요. 아래처럼 로컬 서버로 여세요.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```

## 책 추가하기

`data/books.json`에 항목을 추가하면 돼요.

```json
{
  "title": "책 제목",
  "author": "저자",
  "tags": ["위로", "여행"],
  "quotes": [
    { "t": "밑줄 친 구절\n줄바꿈은 \\n 으로", "p": "p. 24" }
  ],
  "note": "여우의 한 줄 감상",
  "blog": "https://블로그-서평-주소 (없으면 빈 문자열)"
}
```

## 배포 (GitHub + Vercel)

1. 이 폴더를 GitHub 저장소에 올려요.
2. Vercel에서 **Add New → Project**로 그 저장소를 가져와요.
3. Framework Preset은 **Other**, Build Command와 Output Directory는 비워 두면 돼요.
4. 이후 `main` 브랜치에 push할 때마다 자동으로 다시 배포돼요.

## 구조

```
index.html
css/style.css
js/main.js
data/books.json
assets/fox/      여우 포즈 이미지 (투명 WebP)
vercel.json      캐시 설정
CLAUDE.md        Claude Code 작업 안내
```
