// # Task

// Provide 3 unique implementations of the following function in JavaScript.

// **Input**: `n` - any integer

// *Assuming this input will always produce a result lesser than `Number.MAX_SAFE_INTEGER`*.

// **Output**: `return` - summation to `n`, i.e. `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`.



let input = 10;

function sum_to_n_1(input){
    let total = 0;
    for(let i = 1; i <= input; i++)
        total = total + i
    return total;
}


function sum_to_n_2(input){
    let index = 0;
    let total = 0;
    while(true){
        index++;


        total = total + index

        if(index === input)
            break
    }
    return total;
}

function sum_to_n_3(input){
    return input*(input+1)/2
}





let result1 = sum_to_n_1(input)
let result2 = sum_to_n_2(input)
let result3 = sum_to_n_3(input)

console.log(result1)
console.log(result2)
console.log(result3)