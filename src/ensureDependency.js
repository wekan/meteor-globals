import path from 'path';
import fs from 'fs';
import semver from 'semver';
import getGlobal from './getGlobal';
import checkMeteor from './checkMeteor';

export default function ensureDependency(packageName, throwErrors = true) {
  if (process.env.NODE_ENV === 'production') return false;
  const meteor = getGlobal('meteor', 'Meteor');
  if (!meteor || meteor.isClient) return false;

  const [name, version] = packageName.split('@');
  if (getGlobal(name)) return false;

  if (throwErrors && !checkMeteor({ fileCheck: true }, false)) throw new Error('cannot find .meteor/packages file. Are you in a meteor project?');
  const packageFile = path.resolve('./.meteor/packages');
  const installedPackages = fs.readFileSync(packageFile).toString().split('\n').map(p => p.split('@')[0].trim());
  if (installedPackages.indexOf(name) >= 0) {
    if (!version) return false;
    const versionsFile = path.resolve('./.meteor/versions');
    const installed = fs.readFileSync(versionsFile)
      .toString()
      .split('\n')
      .map((packageAndVersion) => {
        const pack = packageAndVersion.split('@');
        return {
          name: pack[0],
          version: pack[1],
        };
      })
      .filter(p => p.name === name)[0];

    if (installed && !semver.satisfies(installed.version, version)) {
      return { name, neededVersion: version, installedVersion: installed.version };
    }
    return false;
  }
  fs.appendFileSync(packageFile, `\n${packageName}`);
  return true;
}
