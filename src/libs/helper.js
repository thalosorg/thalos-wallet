class helper {
  static ospath(path) {
    if(process.platform == 'win32') {
      return path;
    }
    return path.replace(/\\/g,'/').replace(/\.exe/g,'');
  }
}
module.exports = helper;