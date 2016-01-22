---
layout: post
title: 自制stl(1) 空间配置器
tags: c++ stl
categories: 自制stl
---

空间配置器是STL的基础,其主要作用在于为高级组件分配空间.</br>
其定义如下:</br>

```c++
template <typename T>
    class allocator
```

其成员函数有:
+(constructor) 类的构造函数
+(destructor)  类的析构函数
+pointer address(reference x) const  传入该类型引用,返回地址(指针)
+const_pointer address(const_reference x) const 上述函数的常量版本
+pointer allocate(size_type num, const_pointer hint=0) 分配用以存储n个实例化类型T的空间
+void deallocate(pointer p,size_type n) 归还先前配置的空间
+void construct(pointer p, const_reference val) 构造函数 将p构造成t类型,并赋初值val
+void destroy(pointer p) 析构p
+max_size() 返回可配置的最大量
+template <typename U>struct rebine 以相同方法分配U类型

此外还有type等,详见[http://www.cplusplus.com/reference/memory/allocator/?kw=allocator](http://www.cplusplus.com/reference/memory/allocator/?kw=allocator)

#一级空间配置器

一级空间配置器实质是对malloc(p) free(p) (c风格) operator new,operator(p) delete(p) (c++风格)的封装</br>

其c++风格的实现如下:
```c++
        pointer allocate(size_type num, const_pointer hint=0)
        {
            return (pointer)::operator new(num*sizeof(T));
        }
        void deallocate(pointer p,size_type n)
        {
            ::operator delete(p);
        }
```
c风格的实现:
```c++
        pointer allocate(size_type num, const_pointer hint=0)
        {
            return(malloc(num*sizeof(T));
        }
        void deallocate(pointer p,size_type n)
        {
            free(p);
        }
```


#二级空间配置器

二级空间配置器对大于128bytes的请求采用一级空间配置器的方法,对于小于128bytes则先配置一大块内存,将其统一放入,以减少内存碎片问题.</br>

二级空间配置器提供8,16,24,32,40,48,56,64,72,80,88,96,104,112,120,128共计16种小型区块,共其按需调用,对于不为8倍数的请求,主动上调至8的倍数
free-list[16],存储各区块首地址.</br>

对于每类区块其余地址,则由区块内部按链表方式存储.既每类中第一个区块存储有第二个区块的地址,以此类推,最后一个区块中地址为NULL表示结束.</br>

上调至8的倍数:
```c++
        //位操作,加7后后3位置0
        static size_t ROUND_UP(size_t bytes)
        {
            return (bytes+__ALIGN-1)&~(__ALIGN-1);
        }
```

获取freelist下标:
```c++
        //加7保证内存不溢出
        static size_t FREELIST_INDEX(size_t bytes)
        {
            return ((bytes+__ALIGN-1)/__ALIGN-1);
        }
```

摘取区块(分配内存):
```c++
        static void * allocate(size_t n)
        {
            //如果大于128直接调用一级空间配置器
            if(n>__MAX_BATY)
                return(malloc(n));
            //获取存有对应大小区块首地址的数组free_list元素指针
            obj*myFreeList=(obj*)(free_list+ROUND_UP(n));
            //myFreeList所存储的数据即为区块首地址
            obj*result=myFreeList->next;
            //如果区块全部用完,重新填充
            if(result==0)
            {
                //重新填充
                void *r=refill(ROUND_UP(n));
                return(r);
            }
            //更新free_list数组,获取的区块内存有下一个区块的地址.
            myFreeList->next=result->next;
            return (result);
        }
```
归还区块:
```c++
        static void deallocate(void *p,size_t n)
        {
            if(n>__MAX_BATY)
            {
                free(p);
            }
            obj* myFreeList=(obj*)(free_list+ROUND_UP(n));
            obj* q;
            q=(obj*)p;
            //归还的区块中存入下一区块地址
            q->next=myFreeList->next;
            //更新free_list数组
            myFreeList->next=q;
        }
```
区块初始化:

```c++
        static void *refill(size_t n)
        {
            obj* result;
            obj* now_obj;
            obj* next_obj;
            int nobjs=20;
            result=(obj*)chunk_alloc(n,nobjs);//获取内存
            if(nobjs==1)
                return(result);
            obj* myFreeList=(obj*)(free_list+ROUND_UP(n));
             myFreeList->next=(obj *)((void*)result+n);
            next_obj=myFreeList->next;//获取链表首地址
            //依次赋下一元素地址
            for(;nobjs>1;nobjs--)
            {
                now_obj=next_obj;
                next_obj=(obj *)((void*)next_obj+n);
                now_obj->next=next_obj;
            }
            //赋终值
            now_obj->next=0;
            return(result);
        }
```
获取内存:
```c++
        static char *chunk_alloc(size_t size,int &nobjs)
        {
            size_t need=nobjs*size;
            size_t left=end_free-start_free;
            char * result;
            if(left>=need)//如果剩余内存够用,直接分配
            {
                result=start_free;
                start_free+=need;
                return(result);
            }else if(left>=size)//如果不完全够用但至少满足一个区块
            {
                nobjs=left/size;
                result=start_free;
                need=size*nobjs;
                start_free+=need;
                return(result);
            }else//无法满足一个区块
            {
                size_t bytes_to_get=2*need;
                if(left>0)//将剩余内存分配到符合要求的区块类型的列表中
                {
                    obj* myFreeList=(obj*)(free_list+ROUND_UP(left));
                    obj* q=(obj*)start_free;
                    q->next=myFreeList->next;
                    myFreeList->next=(obj*)start_free;
                }
                start_free=(char *)malloc(bytes_to_get);//重新请求内存
                end_free=start_free+bytes_to_get;
                return(chunk_alloc(size,nobjs));//递归调用
            }
        }
```


* * *
    
+一级空间配置器程序：[https://github.com/MemoriesOff/marrySTL/blob/master/allocator.h](https://github.com/MemoriesOff/marrySTL/blob/master/allocator.h)
+二级空间配置器程序：[https://github.com/MemoriesOff/marrySTL/blob/master/alloc.h](https://github.com/MemoriesOff/marrySTL/blob/master/alloc.h)
为说明方便，文章中程序段与整车程序略有不同。
