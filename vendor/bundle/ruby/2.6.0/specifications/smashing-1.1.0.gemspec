# -*- encoding: utf-8 -*-
# stub: smashing 1.1.0 ruby lib

Gem::Specification.new do |s|
  s.name = "smashing".freeze
  s.version = "1.1.0"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Smashing Org (Inherited from: Daniel Beauchamp)".freeze]
  s.date = "2017-12-24"
  s.description = "A framework for pulling together an overview of data that is important to your team and displaying it easily on TVs around the office. You write a bit of ruby code to gather data from some services and let Smashing handle the rest - displaying that data in a wonderfully simple layout. Built for developers and hackers, Smashing is highly customizable while maintaining humble roots that make it approachable to beginners.".freeze
  s.executables = ["smashing".freeze]
  s.files = ["bin/smashing".freeze]
  s.homepage = "http://smashing.github.io/smashing".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3".freeze
  s.summary = "The wonderfully excellent dashboard framework.".freeze

  s.installed_by_version = "3.0.3" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<sass>.freeze, ["~> 3.4.24"])
      s.add_runtime_dependency(%q<coffee-script>.freeze, ["~> 2.4.1"])
      s.add_runtime_dependency(%q<execjs>.freeze, ["~> 2.7.0"])
      s.add_runtime_dependency(%q<sinatra>.freeze, ["~> 2.0.0"])
      s.add_runtime_dependency(%q<sinatra-contrib>.freeze, ["~> 2.0.0"])
      s.add_runtime_dependency(%q<thin>.freeze, ["~> 1.7.0"])
      s.add_runtime_dependency(%q<rufus-scheduler>.freeze, ["~> 3.4.2"])
      s.add_runtime_dependency(%q<thor>.freeze, ["~> 0.19.4"])
      s.add_runtime_dependency(%q<sprockets>.freeze, ["~> 3.7.1"])
      s.add_runtime_dependency(%q<rack>.freeze, ["~> 2.0.0"])
      s.add_development_dependency(%q<rake>.freeze, ["~> 12.0.0"])
      s.add_development_dependency(%q<haml>.freeze, ["~> 5.0.1"])
      s.add_development_dependency(%q<rack-test>.freeze, ["~> 0.6.3"])
      s.add_development_dependency(%q<minitest>.freeze, ["~> 5.10.2"])
      s.add_development_dependency(%q<mocha>.freeze, ["~> 1.2.1"])
      s.add_development_dependency(%q<fakeweb>.freeze, ["~> 1.3.0"])
      s.add_development_dependency(%q<simplecov>.freeze, ["~> 0.14.1"])
    else
      s.add_dependency(%q<sass>.freeze, ["~> 3.4.24"])
      s.add_dependency(%q<coffee-script>.freeze, ["~> 2.4.1"])
      s.add_dependency(%q<execjs>.freeze, ["~> 2.7.0"])
      s.add_dependency(%q<sinatra>.freeze, ["~> 2.0.0"])
      s.add_dependency(%q<sinatra-contrib>.freeze, ["~> 2.0.0"])
      s.add_dependency(%q<thin>.freeze, ["~> 1.7.0"])
      s.add_dependency(%q<rufus-scheduler>.freeze, ["~> 3.4.2"])
      s.add_dependency(%q<thor>.freeze, ["~> 0.19.4"])
      s.add_dependency(%q<sprockets>.freeze, ["~> 3.7.1"])
      s.add_dependency(%q<rack>.freeze, ["~> 2.0.0"])
      s.add_dependency(%q<rake>.freeze, ["~> 12.0.0"])
      s.add_dependency(%q<haml>.freeze, ["~> 5.0.1"])
      s.add_dependency(%q<rack-test>.freeze, ["~> 0.6.3"])
      s.add_dependency(%q<minitest>.freeze, ["~> 5.10.2"])
      s.add_dependency(%q<mocha>.freeze, ["~> 1.2.1"])
      s.add_dependency(%q<fakeweb>.freeze, ["~> 1.3.0"])
      s.add_dependency(%q<simplecov>.freeze, ["~> 0.14.1"])
    end
  else
    s.add_dependency(%q<sass>.freeze, ["~> 3.4.24"])
    s.add_dependency(%q<coffee-script>.freeze, ["~> 2.4.1"])
    s.add_dependency(%q<execjs>.freeze, ["~> 2.7.0"])
    s.add_dependency(%q<sinatra>.freeze, ["~> 2.0.0"])
    s.add_dependency(%q<sinatra-contrib>.freeze, ["~> 2.0.0"])
    s.add_dependency(%q<thin>.freeze, ["~> 1.7.0"])
    s.add_dependency(%q<rufus-scheduler>.freeze, ["~> 3.4.2"])
    s.add_dependency(%q<thor>.freeze, ["~> 0.19.4"])
    s.add_dependency(%q<sprockets>.freeze, ["~> 3.7.1"])
    s.add_dependency(%q<rack>.freeze, ["~> 2.0.0"])
    s.add_dependency(%q<rake>.freeze, ["~> 12.0.0"])
    s.add_dependency(%q<haml>.freeze, ["~> 5.0.1"])
    s.add_dependency(%q<rack-test>.freeze, ["~> 0.6.3"])
    s.add_dependency(%q<minitest>.freeze, ["~> 5.10.2"])
    s.add_dependency(%q<mocha>.freeze, ["~> 1.2.1"])
    s.add_dependency(%q<fakeweb>.freeze, ["~> 1.3.0"])
    s.add_dependency(%q<simplecov>.freeze, ["~> 0.14.1"])
  end
end
