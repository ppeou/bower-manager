const fs = require("fs");
const fse = require("fs-extra");
const configs = {
  output: {
    dir: './output/bower_components'
  },
  bower: {
    dir: './bower_components',
    file: 'bower.json',
    dfile: '.bower.json',
  }
};

main(configs);

function main(opts) {
  console.log('/*- verify bower components -------');
  console.log('');

  const path1 = opts.bower.dir;
  const path2 = opts.output.dir;

  const orgComponentsFolder = fs.readdirSync(path1).sort();
  const cloneComponentsFolder = fs.readdirSync(path2).sort();

  process.stdout.write(`1. comparing number of components: `);
  if(orgComponentsFolder.length === cloneComponentsFolder.length) {
    process.stdout.write('passed');
    console.log('');
    process.stdout.write(`2. verifying components's name: `);
    if(hasSameComponents(orgComponentsFolder, cloneComponentsFolder)) {
      process.stdout.write('passed');
      let invalidCompos = [];

      process.stdout.write(`\n3. validating components's bower\n`);
      orgComponentsFolder.forEach((comp)=>{
        process.stdout.write(`   ${comp}: `);

        const {src: file1, dest: file2} = getBowerPaths(comp, path1, path2, opts.bower.file,  opts.bower.dfile);
        const {result, name, info} = compareBower(file1, file2);

        if(result !== true) {
          invalidCompos.push({name, info});
          process.stdout.write(`failed - ${JSON.stringify(info)}`);
        } else {
          process.stdout.write('passed');
        }
        console.log('');
      });

      console.log('');
      if(invalidCompos.length === 0) {
        process.stdout.write('all components are validated successfully...');
      } else {
        process.stdout.write(`failed - ${invalidCompos.length} component(s)`);
      }
      console.log('');
    } else {
      process.stdout.write('failed - there is at least one unmatched component');
    }
  } else {
    process.stdout.write('failed - number of components are not equal ${folders1.length} <> ${folders2.length}');
  }
  console.log('');
  console.log('---- end verify bower components-*/');
}

function compareBower(bowerPath1, bowerPath2) {
  const bower1 = JSON.parse(fs.readFileSync(bowerPath1, 'utf8'));
  const bower2 = JSON.parse(fs.readFileSync(bowerPath2, 'utf8'));

  const isNameEqual = bower1.name === bower2.name;
  const isDependenciesEqual = compareJsonObject(bower1.dependencies, bower2.dependencies);
  const isDevDependenciesEqual = compareJsonObject(bower1.devDependencies, bower2.devDependencies);
  const isResolutionsEqual = compareJsonObject(bower1.resolutions, bower2.resolutions);
  const isEqual = isNameEqual && isDependenciesEqual && isDevDependenciesEqual && isResolutionsEqual;

  return {result: isEqual,
    name: isNameEqual ? bower1.name : `${bower1.name} <> ${bower2.name}`,
    info: {name: isNameEqual, dependencies: isDependenciesEqual,
      devDependencies: isDevDependenciesEqual, resolutions: isResolutionsEqual}};
}

function compareJsonObject(json1, json2) {
  if(json1 === json2) {return true};
  const keys1 = Object.keys(json1 || {}).sort();
  const keys2 = Object.keys(json2 || {}).sort();

  if(keys1.length === keys2.length) {
    return hasSameComponents(keys1, keys2);
  } else {
    return false;
  }
}

function getBowerPaths(comp, path1, path2, bowerFile,  dbowerFile) {
  const filePath1 = `${path1}/${comp}/${bowerFile}`;
  const filePath1Alt = `${path1}/${comp}/${dbowerFile}`;
  const filePath2 = `${path2}/${comp}/${bowerFile}`;

  const hasBower1 = fse.pathExistsSync(filePath1);
  const hasBower1Alt = fse.pathExistsSync(filePath1Alt);
  const hasBower2 = fse.pathExistsSync(filePath2);
  return {
    src: hasBower1 ? filePath1 : (hasBower1Alt ? filePath1Alt : ''),
    dest: hasBower2 ? filePath2 : ''
  }

}

function hasSameComponents(arr1, arr2) {
  const isNotEqual = arr1.some((name1, i)=> {
    return name1 !== arr2[i];
  });
  return !isNotEqual;
}