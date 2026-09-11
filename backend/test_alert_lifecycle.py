import urllib.request
import json

def test_alert_lifecycle():
    # Ingest a severe reading for Station 1 via POST /api/readings to immediately trigger alert
    payload = {
        "station_id": 1,
        "rainfall": 120.0,
        "soil_moisture": 92.0,
        "slope_angle": 38.0,
        "vibration": 2.5,
        "pore_water_pressure": 48.0,
        "temperature": 21.0
    }
    
    print("Ingesting severe hazard reading to trigger alert...")
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/readings",
        data=req_data,
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    result = json.loads(res.read().decode())
    print("Ingest response prediction:", result["prediction"]["risk_level"], f"(Score: {result['prediction']['risk_score']})")
    print("Alert triggered in response:", result.get("alert_triggered"))
    assert result["prediction"]["risk_level"] in ["Warning", "Critical"]
    assert result.get("alert_triggered") is not None

    # Check /api/alerts
    alerts_res = urllib.request.urlopen("http://127.0.0.1:8000/api/alerts?limit=5")
    alerts_data = json.loads(alerts_res.read().decode())
    print(f"Total alerts in database: {len(alerts_data)}")
    assert len(alerts_data) > 0

    latest_alert = alerts_data[0]
    print(f"Latest Alert #{latest_alert['id']}: Station {latest_alert['station_code']} | Severity: {latest_alert['risk_level']} | Status: {latest_alert['status']}")
    print(f"Trigger factors:\n{latest_alert['trigger_factors']}")
    print(f"Recommended action: {latest_alert['recommended_action']}")

    # Test acknowledging the alert
    ack_req = urllib.request.Request(f"http://127.0.0.1:8000/api/alerts/{latest_alert['id']}/acknowledge", method="POST")
    ack_res = urllib.request.urlopen(ack_req)
    ack_data = json.loads(ack_res.read().decode())
    print("Acknowledge response status:", ack_data["alert"]["status"])
    assert ack_data["alert"]["status"] == "acknowledged"

    # Test resolving the alert
    res_req = urllib.request.Request(f"http://127.0.0.1:8000/api/alerts/{latest_alert['id']}/resolve", method="POST")
    res_res = urllib.request.urlopen(res_req)
    res_data = json.loads(res_res.read().decode())
    print("Resolve response status:", res_data["alert"]["status"])
    assert res_data["alert"]["status"] == "resolved"
    
    # We can also check Station 3's current status in simulation
    st_res = urllib.request.urlopen("http://127.0.0.1:8000/api/stations/3")
    st3 = json.loads(st_res.read().decode())
    latest = st3.get("latest_reading", {})
    print(f"Station 3 (Escalating Demo): Current Risk={latest.get('risk_level')} ({latest.get('risk_score')}/100), Rain={latest.get('rainfall')}mm/h, Moist={latest.get('soil_moisture')}%, PWP={latest.get('pore_water_pressure')}kPa")
    print("Alert lifecycle verification complete!")

if __name__ == "__main__":
    test_alert_lifecycle()
