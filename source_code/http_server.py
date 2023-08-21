import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
os.chdir(os.path.dirname(__file__))
if __name__ == "__main__":
    try:
        server = HTTPServer(("", 8000), SimpleHTTPRequestHandler)
        print(f"сервер запущен на: http://127.0.0.1:8000")
        print("а чтобы завершить - нужно тут нажать Ctl+C на клавиатуре")
        server.serve_forever()
    except KeyboardInterrupt:
        server.socket.close()
        print("работа завершена")