const fs = require('fs');
const fse = require("fs-extra");

const opts = {
  output: {
    file: './output/bower-master-list.json',
  },
  bower: {
    dir: './bower_components/',
    file: 'bower.json',
    dfile: '.bower.json',
  }
};
main({info: {}, details: {}});

function main(root) {
  console.log('/*-gathering bower components:------');
  console.log('');
  //loop compoenents folder in bower_components
  console.log('1. scanning components folder inside bower_components');
  fs.readdir(opts.bower.dir, (err, compFolders) => {
    let i = 0;
    const totalComps = compFolders.length;

    console.log(`  found ${totalComps} components`);
    console.log('');

    compFolders.forEach((comp) => {
      i++;
      console.log(`${comp} (${i} of ${totalComps})`);
      jsObject = null;
      bObject = {};
      compPath = opts.bower.dir + comp + '/';
      bwPath = compPath + opts.bower.file;

      if(fs.existsSync(bwPath)) {
        //read bower.json from bower_components/component/
        console.log(`  scanning ${opts.bower.file}`);
        jsObject = JSON.parse(fs.readFileSync(bwPath, 'utf8'));
        bObject.name = jsObject.name;
        bObject.version = jsObject.version;
        dependencies = jsObject.dependencies;
        devDependencies = jsObject.devDependencies;
        resolutions = jsObject.resolutions;
      }

      if(!bObject.version) {
        //if bower.json doesn't have version, we try to get version form from bower_components/component/.bower.json
        console.log(`  scanning ${opts.bower.dfile}`);
        bwPath = compPath + opts.bower.dfile;
        if(fs.existsSync(bwPath)) {
          jsObject = JSON.parse(fs.readFileSync(bwPath, 'utf8'));
          bObject.version = jsObject.version;
        }
      }

      addRootLevelComponent(root.info, bObject.name, bObject.version, true);

      console.log('  scanning dependencies');
      dependencies && harvestBowerList(root, dependencies, bObject.name, bObject.version, 'dependencies');

      console.log('  scanning devDependencies');
      devDependencies && harvestBowerList(root, devDependencies, bObject.name, bObject.version, 'devDependencies');
      console.log(`  version: ${bObject.version || 'NA'}`);

      console.log('  scanning resolutions');
      devDependencies && harvestBowerList(root, resolutions, bObject.name, bObject.version, 'resolutions');

      console.log(`  version: ${bObject.version || 'NA'}`);

      console.log('');
    });

    console.log(`total processed: ${i} components`);

    console.log(`3. ensure folder ${opts.output.dir}`);
    console.log(`saving to file ${opts.output.file}`);
    fse.ensureFileSync(opts.output.file);
    fs.writeFileSync(opts.output.file, JSON.stringify(root, null, 2));

    console.log('');
    console.log('----end gathering bower components-*/')
  });
}

function harvestBowerList(root, jsonObject, parentName, parentVersion, section) {
  let name, version;
  for(name in jsonObject) {
    version = jsonObject[name];
    addComponent(root, name, version, parentName, parentVersion, section);
  }
}

function addRootLevelComponent(info, name, version, isRootLevel) {
  if(!info[name]) {
    info[name] = {version: version, root: isRootLevel};
  }
}

function addComponent(root, name, version, pname, pversion, section) {
  const {details, info} = root;
  if(!details[name]) {
    details[name] = {
      name,
      version: '',
      'all-versions': [],
      'used-by': []
    };
  }

  const detail = details[name];
  detail['all-versions'].push(version);
  detail['used-by'].push({name: pname, version: pversion, required: version, as: section});

  addRootLevelComponent(info, name, version, false);
}


