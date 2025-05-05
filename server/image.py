import os

import requests # request img from web
import shutil # save img locally


def get_image(url, name):
    res = requests.get(url, stream = True)
    print(res.status_code)
    # pour version local
    file_path = "../kdoapp/public/kdos/" + name
    #file_path = "../static/images/" + name

    #pour prod
    #file_path = "/var/www/html/static/images/" + name

    if res.status_code == 200:
        with open(file_path,'wb') as f:
            shutil.copyfileobj(res.raw, f)
        print('download ok')
        return name
    else:
        print('download NOK')
        return 'unknown.jpg'

def remove_image(pk):
    #path = "/var/www/html/static/images/" + str(pk) + ".jpg"
    path = "../kdoapp/public/kdos/" + str(pk) + ".jpg"
    if os.path.exists(path):
        os.remove(path)


if __name__ == '__main__':
    #get_image('https://m.media-amazon.com/images/I/81HJZQTEZVL._AC_SL1500_.jpg', '1.jpg')
    remove_image(1)