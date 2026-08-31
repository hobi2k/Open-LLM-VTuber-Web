# Codex/Claude reasoning effort 설정

## 개요
Claude Code와 Codex 런타임에 CLI reasoning effort를 선택하는 설정을 추가했다. Codex는 감지된 모델 메타데이터에 맞춰 지원 단계를 표시하고, 설정 목록이 다른 패널 뒤에 가려지지 않도록 공용 선택 UI도 보완했다.

## 주요 변경사항
- Claude Code와 Codex에 `CLI 기본값` 포함 reasoning effort 선택 UI 추가
- Codex 모델 캐시의 모델별 지원 effort 단계 연동
- 모델 기본값 항목을 항상 표시하고 모델 변경 시 지원하지 않는 effort를 기본값으로 정규화
- 선택 목록의 z-index, 최대 높이, 스크롤 처리 개선
- 영어, 일본어, 중국어 번역 추가

## 결과
- 타입 검사 통과
- 변경 파일 ESLint 통과
- 웹 및 Electron 프로덕션 빌드 통과
- Claude `High`, Codex `Ultra`, 모델별 옵션, 저장 API를 브라우저에서 검증

## 다음 단계
- 전체 저장소의 기존 ESLint 누적 오류를 별도 정리
