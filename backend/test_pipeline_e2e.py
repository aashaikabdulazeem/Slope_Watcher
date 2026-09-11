import asyncio
import json
import urllib.request
import websockets

async def test_websocket_and_scenario():
    uri = "ws://127.0.0.1:8000/ws"
    print(f"Connecting to WebSocket at {uri}...")
    async with websockets.connect(uri) as ws:
        # Receive initial snapshot
        initial_raw = await ws.recv()
        snapshot = json.loads(initial_raw)
        print("Received snapshot type:", snapshot.get("type"))
        print(f"Snapshot stations count: {len(snapshot.get('stations', []))}")

        # Trigger flash flood scenario on Station 5 (Puthumala Crest)
        print("\nInjecting 'flash_flood' scenario on Station 5...")
        req_data = json.dumps({"station_id": 5, "scenario": "flash_flood"}).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/simulation/scenario",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        print("Scenario injected response:", res.read().decode())

        # Listen for 3 ticks to watch risk escalate and alert trigger
        print("\nListening for live WebSocket simulation updates...")
        for i in range(4):
            update_raw = await ws.recv()
            update = json.loads(update_raw)
            timestamp = update.get("timestamp")
            stations = update.get("stations", [])
            st5 = next((s for s in stations if s["id"] == 5), None)
            alerts = update.get("alerts", [])
            if st5:
                latest = st5.get("latest_reading", {})
                print(f"[Tick {i+1}] Station 5 ({st5['code']}): Rain={latest.get('rainfall')}mm/h, Moist={latest.get('soil_moisture')}%, Risk={latest.get('risk_level')} ({latest.get('risk_score')}/100)")
            if alerts:
                for a in alerts:
                    print(f"🚨 NEW ALERT TRIGGERED: Station {a.get('station_code')} | Level: {a.get('risk_level')} | Score: {a.get('risk_score')}")
                    print(f"   Contributing: {a.get('trigger_factors')[:100]}...")
                    print(f"   Action: {a.get('recommended_action')[:100]}...")

    # Now verify /api/alerts
    alerts_res = urllib.request.urlopen("http://127.0.0.1:8000/api/alerts")
    alerts_data = json.loads(alerts_res.read().decode())
    print(f"\nTotal alerts in database: {len(alerts_data)}")
    if alerts_data:
        first_alert = alerts_data[0]
        print(f"Latest alert #{first_alert['id']}: Station {first_alert['station_code']} ({first_alert['risk_level']}) - Status: {first_alert['status']}")
        
        # Test acknowledging the alert
        ack_req = urllib.request.Request(f"http://127.0.0.1:8000/api/alerts/{first_alert['id']}/acknowledge", method="POST")
        ack_res = urllib.request.urlopen(ack_req)
        print("Acknowledge response:", ack_res.read().decode())

    # Reset Station 5 back to normal
    print("\nResetting Station 5 back to normal...")
    reset_data = json.dumps({"station_id": 5, "scenario": "normal"}).encode("utf-8")
    reset_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/simulation/scenario",
        data=reset_data,
        headers={"Content-Type": "application/json"}
    )
    urllib.request.urlopen(reset_req)
    print("Reset complete. Pipeline test successful!")

if __name__ == "__main__":
    asyncio.run(test_websocket_and_scenario())
