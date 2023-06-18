#!/bin/sh
bundle exec jekyll serve
exit 0

# 以下是一些环境配置的记录
sudo apt install ruby ruby-dev
sudo apt-get install ruby-full build-essential zlib1g-dev
echo '# Install Ruby Gems here' >> ~/.bashrc
echo 'export GEM_HOME="/usr/local/bin/gems"' >> ~/.bashrc
echo 'export PATH="/usr/local/bin/gems/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
gem sources --add https://gems.ruby-china.com/ --remove https://rubygems.org/
gem sources -l
sudo gem install jekyll bundler