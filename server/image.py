import os

import requests # request img from web
import shutil
from config import MODE


def get_image(url, name):
    res = requests.get(url, stream = True)
    print(res.status_code)
    # pour version local
    #file_path = "../kdoapp/public/kdos/" + name
    #OLD file_path = "../static/images/" + name

    if MODE == "production":
        file_path = "/shared/kdos/" + name
    else:
        file_path = "../kdoapp/public/kdos" + name

    if res.status_code == 200:
        with open(file_path,'wb') as f:
            shutil.copyfileobj(res.raw, f)
        print('download ok')
        return name
    else:
        print('download NOK')
        return 'unknown.jpg'

def remove_image(pk):
    if MODE == "production":
        path = "/shared/kdos/" + str(pk) + ".jpg"
    else:
        path = "../kdoapp/public/kdos" + str(pk) + ".jpg"
    if os.path.exists(path):
        os.remove(path)


if __name__ == '__main__':
    #get_image('https://m.media-amazon.com/images/I/81HJZQTEZVL._AC_SL1500_.jpg', '1.jpg')
    remove_image(1)