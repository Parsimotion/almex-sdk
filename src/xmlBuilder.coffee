_ = require("lodash")

module.exports =
#---

# A builder for an XML string that replaces the $xxx placeholders.
class XmlBuilder
  constructor: (@xml) ->

  # Returns the xml string with the values of the object.
  # The values can be strings, numbers or arrays.
  buildWith: (data) =>
    xml = @xml
    _.forOwn data, (value, key) =>
      xml = xml.replace "$#{key}",
        switch typeof value
          when "string", "number" then value
          else
            (value?.map (element) =>
              content = _(element)
                .mapValues (value, key) => "<#{key}>#{value}</#{key}>"
                .values()
                .join ""
              "<#{key}>#{content}</#{key}>"
            .join "") || ""
    xml
