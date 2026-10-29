# THE MORAVIAN — 카사포마 전시 공간 배치

접속: https://tomaytravel.github.io/casafoma-exhibition-planner/

Codex 프리뷰를 독립 실행 웹앱으로 옮긴 전시·와인 시음 공간 편집기입니다. 외부 서비스나 로그인 없이 브라우저에서 실행됩니다. 초기 배치는 사용자가 제공한 JSON을 반영했습니다.

## 기능

- 본관·별관·연결 보기, 평면/3D, 드래그 회전, 휠 확대
- 테이블·실루엣·액자·현수막·시트지·진열대·시음대·X배너·와인병·와인잔 추가/이동/복제/삭제
- 테이블 90도 회전, 바닥 고정
- 캔버스 표준 1~50호 F/P/M/S 및 A0~A4 액자, 벽 부착/와이어, 벽면 안에서 90도 회전
- 본관/별관 진열대·시음대, 가로·세로·높이 독립 입력과 즉시 반영
- 시음대 중앙의 병 5개·잔 5개와 받침 연결, 이동·크기·높이·공간 변경 추종
- 우측 세로형을 기본으로 한 시트지 3안, 로고와 타이포 크기 독립 조절
- 시트지는 유리면에 고정. 기존/확정 시트지는 높이만 조절. 새 시트지는 최초 가로 위치를 정한 뒤 **가로 위치 확정**
- Ctrl+Z / ⌘Z 실행 취소, Ctrl+Shift+Z / ⌘Shift+Z / Ctrl+Y 다시 실행
- 브라우저 자동 저장, JSON 내보내기/불러오기, JSON 파일 다운로드/업로드
- 모바일 및 시스템 라이트/다크 테마

입력 중인 일반 텍스트의 단축키는 브라우저의 텍스트 실행 취소를 사용합니다.

## 저장과 공유

배치는 현재 브라우저의 localStorage에 저장됩니다. 다른 기기나 사람에게 배치를 전달하려면 **배치 저장·불러오기 → JSON 파일 저장**을 사용합니다. 사이트 주소 자체에는 각 방문자의 변경사항이 공유되지 않습니다.

제공받은 초기 배치 원본은 `src/initial-layout.json`입니다. 새 시트지 고정 조건에 따라 로고 시트지의 유리면 이격값(dy=0.1m)은 로딩 시 0으로 맞춥니다. 가로 이동값(dx=0.25m)과 다른 배치는 유지합니다. 초기 천장고는 대화의 현재 값 2.85m입니다.

## 로컬 실행

```sh
python3 scripts/build.py
python3 -m http.server 8051 --directory docs
```

http://localhost:8051/ 에서 실행합니다.

```sh
node --test tests/*.test.mjs
npm install
npx playwright install chromium
node tests/browser.cjs http://localhost:8051/
```

시스템 Chrome을 사용하려면 `CHROME_PATH`를 지정합니다. 별도로 설치된 Playwright는 `PLAYWRIGHT_MODULE`로 지정할 수 있습니다. 웹앱 실행과 빌드에는 npm 설치가 필요하지 않습니다.

## 배포

GitHub Pages가 `main` 브랜치의 `/docs`를 배포합니다. 소스 수정 후 `python3 scripts/build.py`를 실행하고 `src/`와 `docs/`를 함께 커밋합니다. 정적 배포이며 서버·데이터베이스 비용이 없습니다.

## 모델 가정

본관 바닥 +1.12m, 진입로 우측 벽 1.9m, 별관 문폭 1.6m, 실내 계단 층간 높이 2.7m 및 건물 간 상대 위치는 미실측 임시값입니다. 모델은 배치 검토용입니다. 기존 Blender 정적 파일과 웹앱 편집 상태는 자동 동기화하지 않습니다.

캔버스 규격 출처: https://yoonart.tistory.com/140

검증 항목은 [QA.md](QA.md)에 기록합니다.
