const fs = require("fs");
const fse = require("fs-extra");
const exec = require('child_process').exec;

const configs = {
  input: {
    file: './output/bower-master-list.json',
  },
  output: {
    dir: './output/bower_components'
  },
  bower: {
    dir: './bower_components',
    file: 'bower.json',
    dfile: '.bower.json',
  }
};

fse.removeSync(configs.output.dir);

main(configs);

function main(opts) {
  console.log('/*- re-version bower components --------');
  console.log('');


  console.log(`1. load bower info from ${opts.input.file}`);
  const root = JSON.parse(fs.readFileSync(opts.input.file, 'utf8'));
  const {info} = root;

  console.log(`2. ensure folder ${opts.output.dir}`);
  fse.ensureDirSync(opts.output.dir);

  process.stdout.write(`3. copy ${opts.bower.dir} to ${opts.output.dir} ...`);
  fse.copySync(opts.bower.dir, opts.output.dir);
  console.log('');

  fs.readdir(opts.output.dir, (err, compFolders) => {
    let i = 0;
    const totalComps = compFolders.length;

    console.log(`  found ${totalComps} components`);
    console.log('');

    compFolders.forEach((comp) => {
      i++;
      console.log(`${comp} (${i} of ${totalComps})`);

      compPath = `${opts.output.dir}/${comp}`;
      process.stdout.write(`  is ${opts.bower.file} exist?`);
      useDotBowerIfNoBower(compPath, opts.bower.file, opts.bower.dfile)

      console.log(`  clean up folder`);
      cleanUpCompFolder(`${compPath}`);

      bwPath = `${opts.output.dir}/${comp}/${opts.bower.file}`;
      if(fse.pathExistsSync(bwPath)) {

        jsObject = JSON.parse(fs.readFileSync(bwPath, 'utf8'));

        console.log(`  clean up ${opts.bower.file}`);
        removeUnwantedProperties(jsObject);

        console.log(`  updating ${opts.bower.file}`);
        jsObject.version = info[jsObject.name].version;

        console.log(`  updating dependencies`);
        updateVersion(jsObject.dependencies, info);

        console.log(`  updating devDependencies`);
        updateVersion(jsObject.devDependencies, info);

        console.log(`  saving update to ${opts.bower.file}`);
        fs.writeFileSync(bwPath, JSON.stringify(jsObject, null, 2));
      }

      console.log('');
    });

    console.log(`total processed: ${i} components`);

    console.log('');
    console.log('---- end re-version bower components -*/');
  });
}

function updateVersion(jsonObject, info) {
  let name, version;
  for(name in jsonObject) {
    version = info[name];
    jsonObject[name] = info[name].version;
  }
}

function useDotBowerIfNoBower(compPath, bowerFileName, dbowerFileName) {
  const bowerPath = `${compPath}/${bowerFileName}`;
  const dbowerPath = `${compPath}/${dbowerFileName}`;

  if(!fse.pathExistsSync(bowerPath) && fse.pathExistsSync(dbowerPath)) {
    process.stdout.write(`no - clone ${dbowerFileName} to ${bowerFileName}`);
    fse.copySync(dbowerPath, bowerPath);
  } else {
    process.stdout.write('yes');
  }
}

function cleanUpCompFolder(compFolder) {
  let path;
  ['.bower.json', '.gitignore', '.travis.yml', '.github'].forEach((name) => {
    path = `${compFolder}/${name}`;
    fse.removeSync(path);
  });
}

function removeUnwantedProperties(json) {
  ['variants', 'repository', 'ignore'].forEach((n) => {
    json[n] = undefined;
  });
}