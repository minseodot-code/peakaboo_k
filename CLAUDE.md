# 밑줄 먹는 여우 — 작업 안내

독서 구절 아카이브 웹사이트. 어두운 서재에서 티벳여우가 책을 꺼내 먹고 잠들면, 그 책의 구절이 꿈속에서 펼쳐진다.

## 구조
- `index.html` — 화면 뼈대
- `css/style.css` — 방(3D), 책장, 여우, 꿈 화면 스타일
- `js/main.js` — 모든 동작 (아래 "동작 흐름" 참고)
- `data/books.json` — 실제 책 데이터 (title, author, tags, quotes[{t, p}], note, blog)
- `assets/fox/*.webp` — 여우 포즈 이미지. 모두 배경 투명, 옆모습은 왼쪽을 봄

빌드 도구 없는 정적 사이트. 라이브러리 추가 없이 순수 HTML/CSS/JS로 유지할 것.

## 동작 흐름 (js/main.js)
1. `start()` → 책 데이터·이미지 미리 불러오기 → `intro()`: 오른쪽에서 기어 나와 책장 앞에 섬
2. 대기: 커서가 있으면 `tick()`이 커서를 따라감, 없으면 `idle()`이 혼자 서성임
3. 커서를 방 안쪽 깊이 두면 `cam` 값이 커지며 책장이 끝없이 흘러옴 (`ensureSegs()`가 책장 칸을 만들고 지움)
4. 책 클릭 → `fetchAndEat(spine)`: 걸어가서 꺼냄 → 앉아서 읽음 → 먹음 → 잠
5. `enterDream(book)`: 머리 쪽으로 확대 + 물감 번지듯 꿈 화면 → 구절 순서대로 등장
6. `wake()`: 현실로 복귀 후 다시 대기

## 좌표
- 3D 방 단위는 px. z는 화면 쪽이 +. 상수: `P, ZN, WX, FLOOR, DEPTH, SH_START, SEG, ZDEEP, ZFRONT`
- 여우 위치는 `place(x, z)`, 이동은 `moveTo(x, z, speed)` (가속·감속 포함), 매 프레임 처리는 `tick()`

## 여우 그림
- `POSES` 객체에서 포즈별 프레임, 높이(h), 그림자 폭(sh), 머리·입 위치를 조정
- `stride`가 있는 포즈(walk, crawl)는 걸은 거리에 맞춰 프레임이 넘어감. `fps`가 있는 포즈(eat)는 시간 기준
- 새 프레임을 추가하면 `assets/fox/`에 넣고 `POSES`의 `f` 배열에만 이름을 추가하면 됨

## 규칙
- 동작을 바꿀 때 커서 따라가기, 클릭한 책 꺼내기, 꿈 전환이 깨지지 않는지 항상 확인
- `fetch`를 쓰므로 파일을 직접 열지 말고 로컬 서버로 확인 (`npx serve .`)
- 접근성: 책장은 키보드(Enter/Space)로도 동작, Esc로 꿈에서 깸, `prefers-reduced-motion` 존중
