module.exports = {
    devServer: {     
        https: false   
    },
    publicPath: process.env.NODE_ENV === 'production'
    ? '/client/public/'
    : '/'
} 