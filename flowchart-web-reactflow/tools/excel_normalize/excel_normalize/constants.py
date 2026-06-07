KOSEI_SHEET = "構成"

KOSEI_HEADERS = ("装置製番", "装置名", "ユニット", "動作")

FLOW_HEADERS = (
    "ID",
    "図形種別",
    "接続先(下)",
    "接続先(右)",
    "段",
    "列",
    "Text1",
    "Text2",
    "Text3",
    "色",
)

FLOW_COLUMN_COUNT = len(FLOW_HEADERS)
FLOW_SCHEMA = "table-10col-v1"

DEFAULT_LAYOUT = {
    "width": 160,
    "heightMin": 60,
    "gapV": 30,
    "gapH": 100,
    "baseLeft": 40,
    "baseTop": 40,
}
