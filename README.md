# Know or Nope

교사가 만든 개념 카드를 학생이 단어·그림·설명으로 학습하고, 이해도를 스스로 확인하는 웹서비스입니다. 저장소 이름은 `flip-it`, 서비스 이름은 **Know or Nope**입니다.

**웹앱:** [moonsunzoo.github.io/flip-it](https://moonsunzoo.github.io/flip-it/)

현재 버전은 **학생 학습 흐름을 실행할 수 있는 첫 개발 버전**입니다. 교사용 관리 UI, 인증, 콘텐츠 게시 서버, 이미지 일괄 생산은 후속 작업입니다. PRD 전체 P0 또는 수업 운영 버전의 완성을 의미하지 않습니다.

## 문서

- [PRD v0.2 원본](docs/prd/know-or-nope-prd-v0.2.md)
- [PRD 관리 규칙](docs/prd/README.md)
- [구현 현황과 다음 작업](docs/implementation-status.md)
- [초기 기술 결정](docs/decisions/0001-initial-architecture.md)
- [GitHub Pages 배포](docs/decisions/0002-github-pages.md)
- [클라우드 환경 실행 안내](docs/development.md)

## 시작하기

Node.js 24와 npm을 사용합니다. 외부 API 키나 데이터베이스 없이 실행됩니다.

```sh
npm ci
npm run dev
```

개발 서버는 5173 포트를 사용합니다. URL의 해시로 화면을 전환하므로 별도의 서버 라우팅 설정 없이 정적 빌드에서도 직접 진입과 새로고침이 동작합니다.

```sh
npm run check           # 타입 검사 + 단위 테스트 + 프로덕션 빌드
npx playwright install chromium  # 로컬에 테스트 브라우저가 없을 때 1회
npm run test:e2e        # 빌드 후 실제 브라우저에서 검사
npm run format:check
```

클라우드에 설치된 Chromium 사용:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

## 현재 동작

- 과목·단어장 선택, 전체·주제·개별 카드 범위 선택
- 회차당 한 번 무작위 배치 또는 가나다순 정렬
- 단어·그림·설명의 초기 공개 설정과 학습 중 독립 토글
- 알고 있음 / 모름 / 미판정, 판정 변경·취소
- 새로고침 후 순서·위치·평가 복원, 단어장별 이어하기
- 명시적 완료, 결과 집계, 단어장별 최근 20회 이력
- 그림 없음·이미지 404·저장소 오류·잘못된 기록·콘텐츠 버전 변경 안내

학습 기록은 브라우저 LocalStorage에만 저장됩니다. 같은 기기에서도 브라우저가 다르거나 사이트 주소가 바뀌면 공유되지 않습니다. 여러 탭에서 동시에 변경하면 마지막으로 저장한 기록이 남습니다.

`src/content/catalog.json`은 국어 14장·수학 6장의 **개발용 샘플**입니다. 도식은 저장소에서 자체 제작했으며, 수업 사용 전 교사의 검수가 필요합니다. 이 파일을 직접 편집하는 방식은 교사용 운영 도구를 대체하지 않습니다.

## 구조

```text
docs/prd/             PRD 원본과 버전 관리 안내
docs/decisions/       기술·정책 결정 기록
src/components/      단어장, 설정, 학습, 결과, 이력 화면
src/lib/             공개 데이터 검증, 회차 계산, 로컬 저장
src/content/         공개 샘플 콘텐츠
public/visuals/       자체 제작 학습 도식
tests/e2e/           데스크톱·360px 모바일 브라우저 테스트
```
