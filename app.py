"""
==========================================================================
Portal Transparansi Data Korupsi — Backend Application Server
Teknologi: Python (Flask dengan Standalone Fallback)
Menyediakan REST API untuk metrik realtime dan menyajikan template frontend.
==========================================================================
"""

import os
import json
import time
from datetime import datetime

try:
    from flask import Flask, jsonify, send_file, send_from_directory, request
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Data metrik awal
REALTIME_STATS = {
    "total_kerugian_nominal": 54890000000000,
    "total_kerugian_formatted": "Rp 54,89 Triliun",
    "total_terpidana": 8,
    "aset_disita_nominal": 4120000000000,
    "aset_disita_formatted": "Rp 4,12 Triliun",
    "tingkat_recovery_persen": 78.4,
    "indeks_transparansi": 94.2,
    "status": "ONLINE"
}

if FLASK_AVAILABLE:
    app = Flask(__name__, static_folder=BASE_DIR)

    @app.route('/')
    def route_home():
        return send_file(os.path.join(BASE_DIR, 'index.html'))

    @app.route('/galeri.html')
    @app.route('/galeri')
    def route_galeri():
        return send_file(os.path.join(BASE_DIR, 'galeri.html'))

    @app.route('/analisis.html')
    @app.route('/analisis')
    def route_analisis():
        return send_file(os.path.join(BASE_DIR, 'analisis.html'))

    @app.route('/api/metrics')
    def api_metrics():
        """Endpoint REST API yang mengembalikan angka statistik untuk animasi GSAP."""
        data = REALTIME_STATS.copy()
        data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        return jsonify(data)

    @app.route('/data/pelaku.json')
    @app.route('/pelaku.json')
    def api_pelaku():
        pelaku_path = os.path.join(BASE_DIR, 'data', 'pelaku.json')
        if not os.path.exists(pelaku_path):
            pelaku_path = os.path.join(BASE_DIR, 'pelaku.json')
        return send_file(pelaku_path, mimetype='application/json')

    @app.route('/<path:filename>')
    def serve_static(filename):
        return send_from_directory(BASE_DIR, filename)

else:
    # Standalone Built-in HTTP Server Fallback (Bila Flask tidak terpasang)
    import http.server
    import socketserver

    class StandaloneHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path in ['/api/metrics', '/api/stats']:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                data = REALTIME_STATS.copy()
                data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                self.wfile.write(json.dumps(data).encode('utf-8'))
                return
            return super().do_GET()

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 5000))
    print(f"================================================================")
    print(f"  PORTAL TRANSPARANSI DATA KORUPSI INDONESIA")
    print(f"  Server Aktif di: http://127.0.0.1:{PORT}")
    print(f"  - Beranda:       http://127.0.0.1:{PORT}/")
    print(f"  - Galeri Pelaku: http://127.0.0.1:{PORT}/galeri.html")
    print(f"  - Analisis Data: http://127.0.0.1:{PORT}/analisis.html")
    print(f"  - Endpoint REST: http://127.0.0.1:{PORT}/api/metrics")
    print(f"================================================================")

    if FLASK_AVAILABLE:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    else:
        with socketserver.TCPServer(("", PORT), StandaloneHandler) as server:
            server.serve_forever()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)