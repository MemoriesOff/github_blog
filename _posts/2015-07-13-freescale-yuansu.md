---
layout: post
title: 赛道元素提取与应对
tags: 摄像头组 赛道元素
categories: 飞思卡尔智能车竞赛
---

这是一篇针对2015年比赛赛道元素(单线、障碍、直角、十字)提取的博客。  

#单线

比赛赛道黑线外侧的蓝底灰度值与黑线近似，因此只需判断黑线两侧是否有白色区域即可区分单双线。未避免误判可加入单线位置等辅助因素。
```c
if(LeftLineLeftWhite>10 && Leftblackedg>10)  //左边线左侧白色区域范围大于阈值且左边线值在正常范围内
{
    Station=Leftblackedge;  
    singlestation=Station;
    singleflag=1;
}
```

#障碍

障碍也呈黑色，与单线判别法类似，障碍的两侧也有白色区域，与单线的不同点在于黑色区域宽度，需要注意的是由于场地光线作用，有识别不到的可能性，建议取不同前瞻多次进行判断。由于障碍出现在直道处，也可作为辅助依据

对障碍的应对可取另一侧边线作为循线依据。

```c

if((crossroadflag==0)&&(singleflag==0)&&(lostflag==0)&&(angleflag==0))//非十字、单线、丢线、直角
    if((Leftblackedge>10)&&(Rightblackedge<130)&&(LeftLineLeftWhite>4)&&(LeftLineLeftWhite<10)&&(lastsingleedge>50) &&(lastsingleedge<70))//两侧边线位置值正常且左边线左侧白色区域满足障碍要求且小车在赛道中心
            {
                leftblockflag=1;
            }
```

#直角

直角前后均有一黑色线提示，可检测这一区域，进入直角模式，而后一侧丢线则为直角弯道。

如果PID等参数调节得当，有直接通过的可能。

#十字线

对十字的判别，可取三行不同前瞻，呈现正常、全白、正常即为十字。

十字情况下，可取前瞻较远的那行数据作为循线依据。

```c
//数组为不同前瞻下的数值
 if(((Rightblackedge[3]>110)&&(Leftblackedge[3]<20)) && ((Rightblackedge[4]<130)&&(Leftblackedge[4]>10)) && ((CameraStation[4]>30)&&( CameraStation[4]<100)) )
        {
           crossroadflag=1; 
           Station=Singleblackedge[4];  
        }
```
