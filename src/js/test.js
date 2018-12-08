function foo(x,y){
    let a = [x,x+1,x+2];
    let b;
    b = a[1]-a[0];
    let c = 12;

    console.log('a[b]');
    console.log(a[b]);
    console.log('y[1]');
    console.log(y[1]);
    console.log('y[0]');
    console.log(y[0]);

    if(a[b] < c){
        b = 0;
        return y[b];
    }
    else{
        while(c < 12){
            c = c +1;
        }
        b = 1;
        return y[b];
    }
}
console.log(foo(11,[100,101,true]));