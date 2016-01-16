---
layout: post
title: python爬取p站图片
tags: python 爬虫 p站 图片 
categories: python
---

pixiv简称p站,是一家日本同人画,插画分享网站。我把爬取p站上的热榜图片作为初学爬虫的练手之作，该程序通过抓取第三方p站RSS获取相关排行榜的数据，得到页面地址，进入该页面寻找原始图片地址，下载图片。  

##下载图片时的403错误与模拟登陆

* 关于403错误

   p站出于防止外链、爬虫的考虑，在加载图片页时会通过HTTP Referer检测来源页，当来源页异常时返回403错误，为此，程序在下载图片时需添加该图片页面的地址到header中作为来源页

* 关于模拟用户

   对于未登陆用户，p站不会提供原始图片地址，只会提供一600*600的小图，为了抓取到原始图片，必须模拟登陆。为了方便，这里直接从浏览器得到cookie，在抓取添加到时header中

* 程序实现

```python
cookies='此处改为通过浏览器抓取得到的cookie'
req=urllib.request.Request(imgUrl)
#这里添加来源页
req.add_header('Referer',imgPageUrl)
req.add_header('User-Agent','Mozilla/5.0')
#这里添加cookie
req.add_header('Cookie',cookies)
res=urllib.request.urlopen(req)
```     

##正则表达式  

* 图片地址提取

图片地址一般为：

```html
<img alt="渋谷凛の寒い朝" width="800" height="856" data-src="http://i1.pixiv.net/img-original/img/2016/01/14/01/05/02/54704248_p0.jpg" class="original-image">
```     

这里选取class="original-image"作为关键字进行正则表达式提取

```python
imgUrls=re.findall( r'data-src=".*?" class="original-image"', html, 0)
```

* 从搜索页面中寻找图片页面地址

p站搜索页面链接形式如下，这里只需获取id值即可拼接出图片页面地址
```html
<a href="/member_illust.php?mode=medium&amp;illust_id=54659072" class="work  _work multiple ">
```
正则表达式如下
```python
ids = re.findall( r'illust_id=\d{5,12}">', html, 0)
```

* * *

##程序与致谢 

* 原程序：[https://github.com/MemoriesOff/pivix-Picture-crawl-/blob/master/crawlFromPivix.py](https://github.com/MemoriesOff/pivix-Picture-crawl-/blob/master/crawlFromPivix.py)

* 久远寺千歳的P站排行订阅rss: [http://bangumi.tv/group/topic/23196](http://bangumi.tv/group/topic/23196)
* Wang Jiewen 的github项目: [https://github.com/wjw12/python/blob/master/pixivSpider.py](https://github.com/wjw12/python/blob/master/pixivSpider.py)
* Wang Jiewen 的博客[Python爬虫入门：下载Pixiv特定关键词的高赞作品](https://link.zhihu.com/?target=http%3A//xyzzzz.xyz/%3Fp%3D123)
