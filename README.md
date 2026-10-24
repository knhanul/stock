# Stock Analysis Dashboard

삼성전자 · 삼성전기 · SK하이닉스 동일 업종(반도체) 분석 대시보드.

기존 트레이딩 시스템과 연동할 수 있도록 신호를 JSON 형태로 출력합니다.

## 기능

- 3종목 현황 (가격, 추세, 신호)
- 국내 반도체 vs 미국 SOX 상대 강도
- 장기 / 중기 / 단기 타임프레임 정렬
- 시장 국면 필터 (VIX, 나스닥, 코스피)
- 매매 신호 출력 (JSON)

## 실행

단순 정적 사이트입니다. 아래 중 하나로 열 수 있습니다.

```bash
# Python
python -m http.server 8080

# 또는 Node
npx serve .
```

브라우저에서 `http://localhost:8080` 접속.

## 신호 형식

```json
{
  "symbol": "005930",
  "action": "buy",
  "confidence": 0.72,
  "size": 0.3,
  "reason": "국면 통과 + 타임프레임 정렬 + 상대강도 우위"
}
```

## 다음 단계

- 실제 시세 API 연동 (한투자산, 토스 등)
- SOX / NVDA / TSM 실시간 데이터
- 기존 트레이딩 시스템과 웹훅 또는 파일 연동
