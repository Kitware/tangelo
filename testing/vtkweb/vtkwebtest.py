import datetime
import Image
import itertools

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d-%H:%M:%S")

def compare_images(file1, file2):
    img1 = Image.open(file1)
    img2 = Image.open(file2)

    if img1.size[0] != img2.size[0] or img1.size[1] != img2.size[1]:
        raise ValueError("Images are of different sizes")

    size = img1.size

    img1 = img1.load()
    img2 = img2.load()

    def color_diff(c1, c2):
        return sum(map(lambda v1, v2: abs(v1 - v2), c1, c2))

    indices = itertools.product(range(size[0]), range(size[1]))
    diff = 0
    for i, j in indices:
        p1 = img1[i, j]
        p2 = img2[i, j]
        diff += abs(p1[0] - p2[0]) + abs(p1[1] - p2[1]) + abs(p1[2] - p2[2])
    return diff

    difflist = map(lambda c: color_diff(img2[c[0], c[1]], img2[c[0], c[1]]), indices)
    print difflist
    return sum(difflist)
