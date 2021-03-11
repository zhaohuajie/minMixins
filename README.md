

# 小程序的page中使用混入

在小程序的开发过程中，肯定会有一些公共逻辑避免不了重复书写，为了更好的开发体验（早点下班或上班摸鱼），我选择自己实现一个Page中混入功能（官方已经提供了组件的混入功能[behaviors](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/behaviors.html)）。


**实现原理：** 小程序的页面都是通过Page()函数注册的，想要加入混入功能，可以通过修改Page()函数实现


### 1、首先我们先明确混入的使用方法，参考[vue混入](https://cn.vuejs.org/v2/guide/mixins.html)的使用方式

```js
//test.js  

const test={
    onLoad:function(){
        console.log('混入load')
      
    },
    data:{
        testMixins:'我被混入到页面中了1',
        name:'test1'
    },
    oper(){
        // console.log('混入了自定义函数')
    },
    initData(){
        console.log('initData函数被调用')
    },
    onShareAppMessage() {
        var that = this;
        var title = '积分商城';
        return {
          title: title,
          path: '/pages/integralShop/integralShop' 
        };
        
    },
}

const  test2={
    data:{
        testMixins:'我被混入到页面中了2',
        name:'test2'
    },
    onLoad:function(){
        console.log('混入load2')
    }
}


module.exports={
    test,
	test2
}

```

```js

//index.js
import  {test,test2} from "../../mixins/test"
Page({
    mixins:[test,test2],
	data:{
		
	},
	onLoad(){
		
	}
})
```

**混入策略如下**


 （1）合并声明周期函数，混入逻辑在前，页面在后
 
  mixins:[test1,test2]   如果都有onload生命周期 ，调用顺序test1.onload=>test2.onload=>page.onload
 
 （2）合并data数据,如果存在同名属性，后加载的混入优先级高，page中优先级最高
 
  mixins:[test1,test2]    如果data中都有message属性，test2中的message 会覆盖test1中的，页面中的会覆盖test2中的
 
 （3）合并自定义方法，如果存在同名方法，后加载的混入优先级高，page中优先级最高
 
  mixins:[test1,test2]    如果data中都有message属性，test2中的message 会覆盖test1中的，页面中的会覆盖test2中的  



### 2、基于上述的使用方式，我们来开始实现混入

#### （1）首先需要定义好可以进行混入的生命周期，和页面属性

```js
/**
 * 页面生命周期
 */
const  pageLifeTimes = {
    'onLoad' : [],
    'onShow' : [],
    'onReady' : [],
    'onHide' : [],
    'onUnload' : [],
    'onPullDownRefresh' : [],
    'onReachBottom' : [],
    'onShareAppMessage' : [],
    'onPageScroll' : [],
    'onResize' : [],
    'onTabItemTap' : [],
}

const pageProperties = {
    'data':{}
}
    
```


#### （2）混入之后，我们期望的是在index.js 调用this.onLoad(),会先执行混入中的onLoad，然后执行index.js定义的onLoad,这里我们就是用到一种设计模式 "装饰者模式"，可以在不修改原函数的情况下，在执行函数之前或之后加上自己的行为。

```js
/**
 * 装饰器函数
 * @params {function} fn 原函数
 * @params {desc}   装饰函数的数组
 */
function decorator(fn,desc){
    return function(){

        //页面生命周期函数存在，先执行混入生命周期函数，后执行页面生命周期函数
         let context= desc.reduce((ctx,item)=>{
            return item.apply(this,arguments)
        },{})

        if(fn&&typeof fn =='function'){
            return fn.apply(this,arguments)
        }
		
		//这里返回一个执行内容，是为了兼容onShareAppMessage
        return context
    }
}
```

#### （3）替换page函数

```js
/**
 *  初始化混入
*/
function initMixins(config={}){
    //先存储原page函数
    const  oriPage = Page;

    //定义新的page函数
    Page = options =>{
        
        const mixins=Array.isArray(options.mixins)?options.mixins:[];
        //全局混入
        if(config.globalMixins){
            mixins.unshift(config.globalMixins)
        }
        //获取传入的混入对象数组，进行选项的合并
        if(mixins.length>0){
            options= mixinOptions(options,mixins)
        }
        oriPage(options)
    }
}

```

执行选项合并的具体实现

```js
/**
 * @desc    混入
 * @param {object} options page函数原有options
 * @param {array} mixins   要混入的options
 */
function mixinOptions(options,mixins){
    //因为pageLifeTimes是纯粹的数据，所以直接使用序列化和反序列化来进行一个深拷贝
    let pageLifeTimesCopy=JSON.parse(JSON.stringify(pageLifeTimes));
    mixins.forEach((mixin) =>{
        //混入选项是否是对象
        if(!isObject(mixin)){
            throw new TypeError('mixin is not a object')
        }
        for (let [key ,vlaue] of  Object.entries(mixin)){
            //生命周期函数合并
            if(Object.keys(pageLifeTimesCopy).includes(key)){
                pageLifeTimesCopy[key].push(mixin[key])
                continue
            }

            //页面属性合并
            if(Object.keys(pageProperties).includes(key)){
                pageProperties[key] = {...pageProperties[key],...mixin[key]}
                continue
            }

            //自定义方法,页面中的优先级高
            if(!options[key]){
                options[key] =mixin[key]
            } 
        }
    })
    //混入生命周期
    for(let key  in pageLifeTimesCopy){
        let mixins=pageLifeTimesCopy[key];
        if(mixins.length>0){
            options[key] = decorator(options[key],pageLifeTimesCopy[key])
        }  
    }
    //混入页面属性
    for(let key  in pageProperties){
         options[key] = {...pageProperties[key],...options[key] }
        
    }
    return options
}
```

#### (4) 在app.js中进行初始化

只需要在app.js引入minMixins 文件，然后调用初始化混入函数，初始化是可传入一个config参数，目前只有一个属性，
如果不需要全局混入，则可省略


|	属性名称|类型	|描述	|
|--	|--	|--	|
|	globalMixins|object	|	全局混入的对象|


```js
//app.js
import initMixins from  "./utils/minMixins"
import globalMixins from "./mixins/globalMixins"
initMixins({globalMixins})
App({
  onLaunch() {

  }
})

```


### 项目地址
[quickstart](https://developers.weixin.qq.com/s/4TxWEImB7uok) 小程序代码片段，可直接导入微信开发者工具