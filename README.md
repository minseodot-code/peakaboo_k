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
  "blog": "https://블로그-서평-주소 (없으면 빈 문자열)",
  "color": "#8C6A5A"
}
```

- `color`는 책장에 꽂힌 책등 색이자, 꿈 화면에 번지는 물감 색이에요. 빼면 랜덤 색이 돼요. (`#8C6A5A`, `rgb(140,106,90)`, `teal` 같은 CSS 색 이름 모두 가능)
- 실제 책은 책장 맨 앞 칸(입구 쪽) 첫 줄 왼쪽부터 파일에 적힌 순서대로 꽂혀요. 한 줄을 넘으면 다음 줄로 이어져요.
- 책마다 공유 주소가 있어요: `https://사이트주소/#book-책-제목` (띄어쓰기는 `-`). 이 주소로 들어오면 바로 그 책의 꿈이 열려요. 꿈 화면의 **이 꿈 링크 복사** 버튼으로 복사할 수 있어요. 제목을 바꾸면 주소도 바뀌니 공유한 뒤에는 제목을 그대로 두세요.
- 그 뒤로 끝없이 이어지는 책은 장식용이에요. 장식용 책을 누르면 아직 꿈에서 안 본 실제 책 중 하나가 랜덤으로 나와요. 다 보면 다시 전체에서 골라요.

## 배포 (GitHub + Vercel)

1. 이 폴더를 GitHub 저장소에 올려요.
2. Vercel에서 **Add New → Project**로 그 저장소를 가져와요.
3. Framework Preset은 **Other**, Build Command와 Output Directory는 비워 두면 돼요.
4. 이후 `main` 브랜치에 push할 때마다 자동으로 다시 배포돼요.

## 보기 전용 링크 `/view` 설정 (한 번만)

다른 사람에게 내 꽃밭을 보여주는 고정 주소 `사이트주소/view`는 꽃밭을 Vercel 저장소에 올려 두고 읽어요.
링크를 받는 사람은 아무것도 할 필요 없이 누르면 바로 보여요.

1. Vercel 프로젝트 → **Storage** 탭 → **Upstash for Redis** 선택 → 무료 플랜으로 만들고 이 프로젝트에 연결해요.
   연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경 변수가 자동으로 생겨요.
2. (선택, 비상용) **Settings → Environment Variables**에 `GARDEN_KEY`(나만 아는 비밀번호)를 넣어 두면,
   나중에 브라우저를 바꾸거나 기록을 지웠을 때 꽃밭 주인을 새 브라우저로 옮길 수 있어요.
3. **Deployments**에서 최신 배포를 **Redeploy** 해요.
4. 평소 쓰는 브라우저에서 사이트 오른쪽 링크 버튼을 한 번 누르면 끝. 그 브라우저가 꽃밭 주인으로 등록되고 `사이트주소/view`가 복사돼요.
   그 뒤로는 책을 먹거나 꽃을 자르거나 메모를 쓸 때마다 같은 링크에 자동으로 반영돼요.

## 구조

```
index.html
css/style.css
js/main.js
data/books.json
assets/fox/      여우 포즈 이미지 (투명 WebP)
js/share.js      보기 전용(/view) 읽기·올리기
api/garden.js    /view 꽃밭 저장소 (Vercel 서버 함수)
vercel.json      캐시 설정, /view 주소
CLAUDE.md        Claude Code 작업 안내
```
