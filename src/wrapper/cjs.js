(() => {

/** TEMPLATE **/

if (typeof module !== 'undefined') {
    module.exports = pbkdf2Sha256;
} else {
    GLOBAL['pbkdf2Sha256'] = pbkdf2Sha256;
}

})()