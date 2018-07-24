#first argument is the release num
git checkout develop
git checkout -b release-$1 develop
sh bump_version.sh $1
git checkout master