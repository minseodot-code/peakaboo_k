# 밑줄 먹는 여우 — 작업 안내

독서 구절 아카이브 웹사이트. 크림색 하늘 아래 너른 풀밭에 끝없이 선 책장에서 티벳여우가 책을 꺼내 먹고 잠들면, 그 책의 구절이 꿈속에서 펼쳐진다.

## 구조
- `index.html` — 화면 뼈대
- `css/style.css` — 방(3D), 책장, 여우, 꿈 화면 스타일
- `js/main.js` — 모든 동작 (아래 "동작 흐름" 참고)
- `js/share.js` + `api/garden.js` — 보기 전용 고정 주소 `/view`(vercel.json rewrite → `/`. cleanUrls라 목적지에 .html을 쓰면 404, 모음 페이지는 `/archive?view`): 서버 함수 `/api/garden`(라이브러리 없음, Upstash Redis REST, 환경 변수 KV_REST_API_URL/TOKEN)에 올린 꽃밭(먹은 책·기록·메모·꽃다발)을 읽음. 올리기는 '주인 표'(localStorage `peakaboo-owner`, 헤더 `x-garden-owner`)로: 링크 버튼(`#shareView`)을 처음 누른 브라우저가 입력 없이 주인으로 등록(서버 `peakaboo:owner`에 해시), 그 뒤로 그 브라우저에서만 `savePile`/`writeList`/메모 저장 때마다 `schedulePublish()`가 자동으로 올림(`peakaboo-owned`). 다른 브라우저는 403 → `#keyAsk`에서 비상용 환경 변수 `GARDEN_KEY`(선택)를 넣으면 주인을 옮김. `VIEW`=true면 그 내용만 읽고 아무것도 저장하지 않음, 책 먹기·단축키·꽃 자르기·메모 쓰기 없음(`setupViewMode()`). 예전 `?view=<압축>` 링크도 계속 열림. 로컬 `npx serve`로는 /view·/api가 안 돌아감(Vercel 또는 비슷한 테스트 서버 필요)
- `archive.html` + `js/archive.js` + `css/archive.css` — 먹은 책 모음 페이지 (오른쪽 책 버튼). 책을 누르면 `index.html#book-제목`으로 그 꿈을 다시 엶
- `js/write.js` — 책 기록하기: 오른쪽 연필 버튼(`#writeBook`) = 새 책, 꿈 페이지 '고쳐 쓰기'(`#editBook`) = 고치기·지우기. 책 이름·작가·구절(페이지 선택)·짧은 메모·책 색을 창(`#bookForm`)에 써서 저장. 책 목록은 localStorage `peakaboo-books`(처음 저장 때 books.json 내용을 색까지 고정해 옮겨 옴, 그 뒤로 이것이 기준, `loadBooks()`가 우선 읽음), 메모는 `peakaboo-memo`. 새 책은 책장 맨 앞(BOOKS 맨 앞)에 꽂히고 '저장하고 여우에게 건네기'면 여우가 바로 꺼내 먹음. 이름을 바꾸거나 지우면 `migrateSlug()`로 더미·기록·메모·꽃다발 이름표를 맞추고 `commitBooks()`가 맨 앞 칸·더미·꽃밭을 다시 그림. 보기 전용에는 책 목록이 `k`로 함께 올라감(api/garden.js가 정리해 저장)
- `data/books.json` — 처음 책 데이터(사이트에서 책을 쓰기 전까지 쓰임) (title, author, quotes[{t, p}], note, blog, color(선택)). p(페이지)는 선택: 숫자만 쓰면 'p. 24'로 보임. note는 메모 칸의 처음 내용 (tags는 지금 화면에 안 씀)
  - 실제 책은 책장 0번 칸 첫 줄부터 순서대로(`.spine.real`, `data-b`=책 번호). 그 외 장식용 책을 누르면 `pickUneaten()`이 안 먹은 실제 책을 고름
- `assets/fox/*.webp` — 여우 포즈 이미지. 모두 배경 투명, 옆모습은 왼쪽을 봄
- `assets/meadow/` — 배경 풀밭(field, #stage 배경), 꽃덤불(clump1~5, 지금은 안 씀), 꿈 밤하늘(night). 책장이 안쪽으로 사라지는 안개는 각 칸(.seg)의 mask이고 `setMask()`가 위치를 맞춤 (마스크 앞쪽 3000px은 불투명 여백: 없으면 안쪽으로 들어갈 때 책장 앞부분이 잘려 옆면과 떨어져 보임)
- `assets/book/` — 손으로 그린 책 한 권(미드저니): 날아가는 책 `fly_a`(옆)·`fly_b`(비스듬히)·`fly_c`(표지), 먹은 책 더미 `lay`(눕힌 책). 표지는 무색이고 `*_mask.webp`(투명도 = 표지 모양)로 책 색을 곱해 입힘. 날아가는 책은 `makeFlyBook(color, views)` + `swapViews()`가 방향 그림을 차례로 바꿔 보여줌. 더미 책 버튼은 책 두께만큼의 띠이고 그림(::before/::after)은 그 위로 올라옴. 마스크는 꼭 투명도로 만들 것 (회색조 그림이면 네모 판으로 칠해짐)
- `assets/books/*.webp` — 손으로 그린 책등 그림. `js/main.js`의 `PAINTED`(파일 이름, 가로/세로 비율 ar, 평균 색 c) 목록에서 골라 책장을 채움. 새 책등을 추가하면 파일을 넣고 `PAINTED`에 한 줄 추가

빌드 도구 없는 정적 사이트. 라이브러리 추가 없이 순수 HTML/CSS/JS로 유지할 것.

## 동작 흐름 (js/main.js)
1. `start()` → 크림색 막(#curtain)으로 덮은 채 책 데이터 + 첫 화면 그림(`sceneImages()`: 배경·책등·꽃·더미 책, 그리고 여우는 걷기·서기·돌기만)을 받아 decode까지 마침(최대 `SCENE_WAIT` 9초) → 책장을 만든 다음 프레임에 막을 걷음(`revealScene()`) → 나머지 여우 그림은 그 뒤 `foxRest()`로 뒤에서 받음. 첫 화면에 새 그림을 더하면 `sceneImages()`에도 넣을 것 → `intro()`: 오른쪽에서 기어 나와 책장 앞에 섬 (걸어오는 시간 8초, 서기까지 약 9초. 등장 중 책장을 누르면 서자마자 그 책을 꺼냄. `intro()`의 `T`로 조절)
2. 대기: 커서가 있으면 `tick()`이 커서를 따라감, 없으면 `idle()`이 혼자 서성임. 커서가 오른쪽 버튼(둘레 90px 포함)·말풍선 위면 `uiHold`로 멈춰 섬
3. 커서를 방 안쪽 깊이 잠깐(`DEEP_DWELL` 0.45초) 두면 `cam` 값이 커지며 책장이 끝없이 흘러옴 (`ensureSegs()`가 책장 칸을 만들고 지움)
4. 책 클릭 → `fetchAndEat(spine)` = `fetchAndSit()`(걸어가서 꺼냄 → 앉아서 읽음) + `eatAndSleep()`(먹음 → 잠 → 꿈)
   - 단축키: `1` = fetchAndSit 후 앉은 채 기다림(mode 'seated'), `2` = 앉아 있으면 eatAndSleep, 서 있으면 처음부터 끝까지. 메모 칸에 글 쓰는 중엔 무시
5. `enterDream(book)`: 머리 쪽으로 확대 + 물감 번지듯 꿈 화면 → 구절 순서대로 등장. 꿈 페이지(`renderDream()`)는 제목 · 작가 · 인상 깊은 문장(페이지 선택) · 메모. 메모는 책마다 `localStorage` `peakaboo-memo`에 저장(이 브라우저에만), 모음 페이지 카드에도 보임
6. `wake()`: 현실로 복귀 → `addToPile()`로 방금 꿈꾼 책이 입구 근처 '먹은 책 더미'로 날아가 쌓임 → 다시 대기
- 책꽃: 먹은 책마다 언덕에 그 책 색의 꽃이 핌(`bloomFlower()`, 더미와 같은 `pile` 목록 사용). 꽃 모양·위치는 책 제목 해시로 고정(`flowerSpot()`). 그림은 `assets/flowers/f1~9.webp`, 꽃잎 마스크 `f1m~f9m.webp`(꽃잎에만 책 색을 곱함). 꽃을 누르면 `dreamAgain()`
- 오른쪽 도구 버튼(`#tools`): 책 모양 = archive.html, 가위 = `askSnip()` → 확인 말풍선(`#snipAsk`, 자를 송이 수 드롭다운 `#snipCount`: 1~핀 꽃 수, 처음엔 전부) → `cutFlowers()`가 먼저 핀(pile 앞쪽) 꽃부터 그 수만큼 자름. 자른 꽃의 책만 pile에서 빠지고 나머지 꽃은 남음
  - `cutFlowers()`: 여우가 가까운 꽃부터 찾아가(바로 옆 120px 안의 꽃은 그 자리에서 이어서) 가위로 자름: snip 포즈(r_snip_open ↔ r_snip_shut, `snipFlower()`), 가위 날이 맞물리는 곳 `SNIP_AT`이 꽃줄기에 오도록 `snipReach()`만큼 옆에 섬(오른쪽 끝·더미 근처 꽃은 반대편). 잘린 꽃은 떠올라 여우 품으로 → 화면 앞(`GIVE`)으로 나와 빈 꽃다발을 든 포즈(`give` = r_give)가 되면 꽃이 한 송이씩 꽂힘. 꽃은 여우 안의 층(`makeGiveLayer()`, #giveLayer)에 그려지고 그 위를 앞쪽 포장지·앞발 그림(r_give_front)이 덮음. 꽃 꽂는 점은 `GIVE_STEM`(그림 비율) → `giveBouquet()`: 카메라(#stage)가 꽃다발 쪽으로 확대 → '꽃다발 받기'(또는 Esc)로 받으면 꽃다발만(r_give_wrap + r_give_wrapfront + 꽃) 화면 아래로 내려가고 여우는 빈손(stand)으로 꾸벅. 꽃밭과 `pile`은 비워짐
  - 기록: `peakaboo-archive`(먹은 책 slug와 처음 먹은 시각, 꽃을 잘라도 남음), `peakaboo-bouquets`(받은 꽃다발). archive.html 아래 '기록 모두 지우기'로 전부 초기화
  - 꽃 모양은 `flowerType(slug)`(책 제목 해시)라 archive.js도 같은 꽃을 그림. 바꾸면 두 파일 모두 맞출 것
- 먹은 책 더미: `pile`(책 번호 목록)을 `localStorage`의 `peakaboo-pile`에 책 제목 slug로 저장해 다음 방문에도 남음. 더미의 책을 누르면 `dreamAgain()`으로 그 책을 다시 꿈꿈. 위치는 `PILE`, 한 더미 최대 권수는 `PILE_PER_STACK`
- 꿈 주소: `#book-제목`(공백→`-`, `bookSlug()`). 그 주소로 들어오면 `intro()` 대신 `openFromLink()`로 바로 꿈. 구절은 `revealOnScroll()`이 화면에 들어올 때 하나씩 띄움. 물감 색은 `tintDream()`이 책 color로 `--t1/--t3` 지정

## 좌표
- 3D 방 단위는 px. z는 화면 쪽이 +. 상수: `P, ZN, WX, FLOOR, DEPTH, SH_START, SEG, ZDEEP, ZFRONT`
- 여우 위치는 `place(x, z)`, 이동은 `moveTo(x, z, speed)` (가속·감속 포함), 매 프레임 처리는 `tick()`
- 성능: 여우(#fox)는 3D 방(#world) 밖 `#stage`에 있는 평면 레이어. `proj()`로 방 좌표를 화면 좌표로 계산해 옮김. 바닥은 무늬(#floorP)·어둠(#floorFade)·빛(#floorGlow) 판으로 나눔. 큰 3D 판에 그라데이션을 여러 겹 쌓거나 매 프레임 스타일을 바꾸면 버벅이니 피할 것

## 여우 그림
- `POSES` 객체에서 포즈별 프레임, 높이(h), 그림자 폭(sh), 머리·입 위치를 조정
- `stride`가 있는 포즈(walk, crawl)는 걸은 거리에 맞춰 프레임이 넘어감. `fps`가 있는 포즈(eat)는 시간 기준
- 새 프레임을 추가하면 `assets/fox/`에 넣고 `POSES`의 `f` 배열에만 이름을 추가하면 됨
- `dx`, `dy`(선택): 그림 위치 보정(px). dx +는 꼬리 쪽, dy +는 아래. `applyLook()`이 적용
- 크기·위치 맞추기: URL 끝에 `#debug` → 조정 패널(`js/debug.js`, #debug일 때만 로드). "값 복사"한 줄을 `POSES`의 같은 이름 줄과 바꾸면 됨

## 규칙
- 동작을 바꿀 때 커서 따라가기, 클릭한 책 꺼내기, 꿈 전환이 깨지지 않는지 항상 확인
- `fetch`를 쓰므로 파일을 직접 열지 말고 로컬 서버로 확인 (`npx serve .`)
- 접근성: 책장은 키보드(Enter/Space)로도 동작, Esc로 꿈에서 깸, `prefers-reduced-motion` 존중
- 배경 풀밭(`assets/meadow/field.webp`): 지평선이 그림 위에서 42%(= 책장 소실점, #viewport perspective-origin)에 오도록 미드저니 그림을 옆·아래로 넓혀 만듦. 그림을 바꾸면 이 비율을 맞출 것
- 먼 책장: 진짜 책(.seg)은 카메라에서 약 1150px까지만 만들고, 그 너머 지평선까지는 `drawFar()`가 책장 한 칸 그림(`assets/tex/farshelf.webp`)을 원근대로 잘게 나눠 #stage 맨 뒤 캔버스(#farShelf)에 그림. 멀수록 크림색 안개. 책장 모양(책·나무판)을 크게 바꾸면 이 그림도 다시 찍을 것
- index.html·archive.html에 `<base href="/">`: 휴대폰 앱 안 브라우저가 `/view/`처럼 끝에 /를 붙여도 css·js·그림·데이터를 맨 위에서 찾게 함. vercel.json도 `/view/`, `/view/…`를 `/`로(.html 쓰지 말 것). `#`만 있는 a 링크를 새로 만들지 말 것(base 때문에 첫 화면으로 감)
- `vercel.json`이 assets를 1년 캐시함: 그림을 바꿀 땐 같은 이름으로 덮어쓰지 말고 새 파일 이름을 쓸 것 (안 그러면 방문자 브라우저에 예전 그림이 남음)
