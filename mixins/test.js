const app=getApp()
const test={
    onLoad:function(){
        console.log('混入load')
      
    },
    data:{
        testMixins:'我被混入到页面中了1',
        name:'test1'
    },
    initData(){
        console.log('initData函数被调用')
    },
    onShow(){
        // console.log('mixins','onShow')
    },
    onShareAppMessage() {
        var that = this;
        var title = '积分商城';
        return {
          title: title,
          // imageUrl: cover,
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