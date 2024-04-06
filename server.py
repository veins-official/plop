from http.server import HTTPServer, SimpleHTTPRequestHandler
from socket import gethostbyname, gethostname
from _thread import start_new_thread


PORT = 8080

if __name__ == "__main__":
    httpd = HTTPServer(("", PORT), SimpleHTTPRequestHandler)
    start_new_thread(httpd.serve_forever, ())
    print(f"Running server on http://{ gethostbyname(gethostname()) }:{ PORT }")
    input()
