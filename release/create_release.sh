#first argument is the release num
git checkout develop
git add .
git commit -m "'auto bump it to version $1'"
git checkout -b release-$1 develop
sh release/bump_version.sh $1
git checkout master