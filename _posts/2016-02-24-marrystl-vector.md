---
layout: post
title: 自制stl(3) vector
tags: c++ stl
categories: 自制stl
---

vector是一种动态数组，是基本数组的类模板。其内部定义了很多基本操作.</br>
其核心思想是一旦分配空间满载，自动申请一块更大的空间，并将数组内容从原空间中转移。

其成员变量主要有:</br>

```c++
        Alloc date_allocator;  //空间配置器
        pointer start;   //使用空间头
        pointer finish;  //使用空间尾
        pointer end_of_storage; //可用空间尾
```

#关于空间分配与成员变量处理

在构造时分配使用空间配置器分配空间，将首地址赋值start，end_of_storage表示可用地址的下一个地址，finish根据使用情况上下浮动。

关于其对成员变量的处理，这里以插入为例进行说明：

首先判断空间是否够用，不够则申请新空间，将整个数组搬移至新空间。

然后执行插入操作，将插入点之后的元素顺序向后移动，空出位置用以插入。这步骤也可与上步结合。

#成员变量的访问

数组形式的实现：

```c++
        reference operator[](size_type n)
        {
            return *(start+n);
        }
```

此外还可使用at方法，二者区别在于operator[]不作越界检查以提高效率。



#c++11 for range 的实现 

c++中规定，for range有两种实现方法：

+ 查找成员函数 begin 或 end；找到任意一个，就会决定用 y.begin() 作为起始、y.end() 作为结束使用 begin 和 end 函数；

+  begin(y)  end(y)

在此我们构造begin、end成员函数：

```c++
        iterator begin()
        {
            return start;
        }

        const_pointer begin()const
        {
            return start;
        }


        iterator end()
        {
            return finish;
        }

        const_pointer end()const
        {
            return finish;
        }
```

即可使用for range功能。
