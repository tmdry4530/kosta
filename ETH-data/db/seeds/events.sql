-- Generated from docs/EVENTS.md by db/seeds/load_events.py
INSERT INTO events (id, name_ko, name_en, event_date, category, region, description, source_url)
VALUES
    ('covid_black_thursday', '코로나 블랙 서스데이', 'COVID Black Thursday', '2020-03-12', 'crash', 'global', '코로나19 팬데믹 공포로 BTC가 하루 만에 약 50% 폭락. 전 세계 자산이 동반 급락.', 'https://en.wikipedia.org/wiki/2020_stock_market_crash'),
    ('defi_summer', 'DeFi 서머', 'DeFi Summer', '2020-06-15', 'mania', 'global', 'Compound의 거버넌스 토큰 분배를 시작으로 DeFi 프로토콜 TVL이 폭증한 시기.', 'https://en.wikipedia.org/wiki/Decentralized_finance'),
    ('btc_ath_2021', 'BTC 첫 6만달러 돌파', 'BTC All-Time High 2021', '2021-04-14', 'rally', 'global', 'BTC가 사상 첫 $64,000을 돌파한 강세장 정점. 코인베이스 상장과 맞물림.', 'https://www.cnbc.com/2021/04/14/bitcoin-btc-and-ether-eth-prices-rally-ahead-of-coinbase-listing.html'),
    ('china_mining_ban', '중국 채굴 금지', 'China Mining Ban', '2021-05-21', 'regulation', 'global', '중국 정부가 BTC 채굴 전면 금지. 글로벌 해시레이트 절반 가까이 급락.', 'https://en.wikipedia.org/wiki/Cryptocurrency_in_China'),
    ('btc_ath_2021_nov', 'BTC 사상 최고가', 'BTC ATH November 2021', '2021-11-10', 'rally', 'global', 'BTC가 약 $69,000으로 사상 최고가 기록. 강세장의 정점.', 'https://www.forbes.com/sites/cbovaird/2021/11/10/bitcoin-hits-latest-all-time-high-close-to-69000-as-multiple-factors-drive-gains/'),
    ('luna_collapse', '테라/루나 붕괴', 'Terra/LUNA Collapse', '2022-05-09', 'crash', 'global', '알고리즘 스테이블코인 UST의 디페깅과 LUNA 토큰의 99%+ 폭락. 약 $400억 시가총액 증발.', 'https://en.wikipedia.org/wiki/Terra_(blockchain)'),
    ('ethereum_merge', '이더리움 머지', 'Ethereum Merge', '2022-09-15', 'rally', 'global', '이더리움이 PoW에서 PoS로 전환. 에너지 소비 99.95% 감소.', 'https://ethereum.org/en/upgrades/merge/'),
    ('ftx_collapse', 'FTX 파산', 'FTX Collapse', '2022-11-11', 'crisis', 'global', '세계 2위 거래소 FTX가 유동성 위기로 파산 신청. 암호화폐 시장 신뢰도에 큰 충격.', 'https://en.wikipedia.org/wiki/Bankruptcy_of_FTX'),
    ('silicon_valley_bank', '실리콘밸리뱅크 파산', 'Silicon Valley Bank Failure', '2023-03-10', 'crisis', 'global', 'SVB 파산으로 USDC 발행사 Circle의 예치금 일부가 묶임. USDC 일시 디페깅.', 'https://en.wikipedia.org/wiki/Collapse_of_Silicon_Valley_Bank'),
    ('btc_etf_approval', '미국 BTC 현물 ETF 승인', 'US Bitcoin Spot ETF Approval', '2024-01-10', 'rally', 'global', 'SEC가 11개 BTC 현물 ETF를 동시 승인. 제도권 자금 유입의 신호탄.', 'https://www.sec.gov/news/statement/gensler-statement-spot-bitcoin-011023'),
    ('btc_halving_2024', 'BTC 4차 반감기', 'BTC Halving 2024', '2024-04-19', 'rally', 'global', 'BTC 블록 보상이 6.25 → 3.125 BTC로 반감. 4년 주기의 공급 충격 이벤트.', 'https://en.wikipedia.org/wiki/Bitcoin'),
    ('eth_etf_approval', '미국 ETH 현물 ETF 승인', 'US Ethereum Spot ETF Approval', '2024-05-23', 'rally', 'global', 'SEC가 ETH 현물 ETF를 승인. ETH의 제도권 진입 가속.', 'https://www.sec.gov/'),
    ('trump_tariff_shock', '트럼프 대중 100% 관세 충격', 'Trump 100% China Tariff Shock', '2025-10-10', 'regulation', 'global', '중국의 희토류 수출 통제 강화 이후, 트럼프 대통령이 중국산 수입품에 100% 관세를 부과하겠다고 발표. 위험자산 전반이 흔들리며 암호화폐도 영향권에 들어감.', 'https://apnews.com/article/trump-xi-china-cc47e258cfc6336dfddcc20fa67a3642'),
    ('us_iran_war', '미국-이란 전쟁 발발', 'US-Iran War Outbreak', '2026-02-28', 'crisis', 'global', '미국과 이스라엘의 대이란 공습으로 전쟁이 본격화되며 지정학적 위험이 급등. 에너지·위험자산 시장 전반이 크게 흔들림.', 'https://en.wikipedia.org/wiki/2026_Iran_war'),
    ('trump_crypto_executive_order', '트럼프 암호화폐 행정명령', 'Trump Crypto Executive Order', '2025-01-23', 'regulation', 'global', '트럼프 대통령이 미국의 암호화폐 친화 정책을 명문화한 행정명령에 서명.', 'https://www.whitehouse.gov/fact-sheets/2025/01/fact-sheet-executive-order-to-establish-united-states-leadership-in-digital-financial-technology/'),
    ('kr_kimchi_premium_2017', '김치프리미엄 정점 (2017)', 'Kimchi Premium Peak 2017', '2017-12-17', 'mania', 'kr', '한국 거래소의 BTC 가격이 글로벌 대비 50% 이상 비싼 김치프리미엄이 정점에 도달. 투기 광풍.', 'https://en.wikipedia.org/wiki/Kimchi_premium'),
    ('kr_ico_ban', 'ICO 전면 금지', 'Korea ICO Ban', '2017-09-29', 'regulation', 'kr', '금융위원회가 모든 형태의 ICO를 금지한다고 발표. 한국 발행 토큰 프로젝트들이 해외로 이전.', 'https://www.coindesk.com/markets/2017/09/29/south-korean-regulator-issues-ico-ban'),
    ('kr_upbit_hack_2019', '업비트 해킹', 'Upbit Hack 2019', '2019-11-27', 'crisis', 'kr', '업비트 핫월렛에서 약 342,000 ETH(당시 $50M)가 유출. 한국 최대 거래소의 보안 사고.', 'https://en.wikipedia.org/wiki/Upbit'),
    ('kr_special_act', '특금법 시행', 'Korean Special Reporting Act', '2021-03-25', 'regulation', 'kr', '가상자산사업자(VASP) 신고제 도입. 미신고 거래소 다수 폐쇄, 시장 정리 가속.', 'https://www.coindesk.com/policy/2021/04/01/s-koreas-crypto-rules-might-only-help-the-big-4-exchanges'),
    ('kr_terra_aftermath', '테라 사태 한국 여파', 'Korean Terra Aftermath', '2022-05-19', 'crisis', 'kr', '테라폼랩스 본사가 한국에 있어 국내 투자자 피해 집중. 권도형 수배 시작.', 'https://www.coindesk.com/policy/2022/06/01/south-korean-government-to-form-digital-assets-committee-in-response-to-terra-collapse-report'),
    ('kr_user_protection_act', '가상자산 이용자 보호법 시행', 'Virtual Asset User Protection Act', '2024-07-19', 'regulation', 'kr', '한국 최초의 가상자산 전용 이용자 보호 법률 시행. 시세조종/미공개정보이용 처벌 근거 마련.', 'https://www.loc.gov/item/global-legal-monitor/2024-07-18/south-korea-act-to-regulate-cryptocurrency-markets-goes-into-effect/')
ON CONFLICT (id) DO UPDATE SET
    name_ko = EXCLUDED.name_ko,
    name_en = EXCLUDED.name_en,
    event_date = EXCLUDED.event_date,
    category = EXCLUDED.category,
    region = EXCLUDED.region,
    description = EXCLUDED.description,
    source_url = EXCLUDED.source_url;
