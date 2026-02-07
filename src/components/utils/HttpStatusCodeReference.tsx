import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Globe } from "lucide-react";
import { useUtilKeyboardShortcuts } from "@/components/KeyboardShortcuts";

interface HttpStatusCode {
  code: number;
  title: string;
  description: string;
  category: string;
  color: string;
}

const httpStatusCodes: HttpStatusCode[] = [
  // 1xx Informational
  { code: 100, title: "Continue", description: "The server has received the request headers and the client should proceed to send the request body.", category: "Informational", color: "bg-blue-500" },
  { code: 101, title: "Switching Protocols", description: "The requester has asked the server to switch protocols and the server has agreed to do so.", category: "Informational", color: "bg-blue-500" },
  { code: 102, title: "Processing", description: "The server has received and is processing the request, but no response is available yet.", category: "Informational", color: "bg-blue-500" },

  // 2xx Success
  { code: 200, title: "OK", description: "The request has succeeded.", category: "Success", color: "bg-green-500" },
  { code: 201, title: "Created", description: "The request has been fulfilled and has resulted in one or more new resources being created.", category: "Success", color: "bg-green-500" },
  { code: 202, title: "Accepted", description: "The request has been received but not yet acted upon.", category: "Success", color: "bg-green-500" },
  { code: 203, title: "Non-Authoritative Information", description: "The returned meta-information is not exactly the same as is available from the origin server.", category: "Success", color: "bg-green-500" },
  { code: 204, title: "No Content", description: "The server successfully processed the request and is not returning any content.", category: "Success", color: "bg-green-500" },
  { code: 205, title: "Reset Content", description: "The server successfully processed the request, but is not returning any content and requires that the user agent reset the document view.", category: "Success", color: "bg-green-500" },
  { code: 206, title: "Partial Content", description: "The server is delivering only part of the resource due to a range header sent by the client.", category: "Success", color: "bg-green-500" },
  { code: 207, title: "Multi-Status", description: "The message body that follows is an XML message and can contain a number of separate response codes.", category: "Success", color: "bg-green-500" },
  { code: 208, title: "Already Reported", description: "The members of a DAV binding have already been enumerated in a previous reply to this request.", category: "Success", color: "bg-green-500" },
  { code: 226, title: "IM Used", description: "The server has fulfilled a request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.", category: "Success", color: "bg-green-500" },

  // 3xx Redirection
  { code: 300, title: "Multiple Choices", description: "There are multiple options for the resource that the client may follow.", category: "Redirection", color: "bg-yellow-500" },
  { code: 301, title: "Moved Permanently", description: "This and all future requests should be directed to the given URI.", category: "Redirection", color: "bg-yellow-500" },
  { code: 302, title: "Found", description: "The target resource resides temporarily under a different URI.", category: "Redirection", color: "bg-yellow-500" },
  { code: 303, title: "See Other", description: "The server is redirecting to a different resource that should be retrieved using a GET request.", category: "Redirection", color: "bg-yellow-500" },
  { code: 304, title: "Not Modified", description: "The resource has not been modified since the version specified by the request headers.", category: "Redirection", color: "bg-yellow-500" },
  { code: 305, title: "Use Proxy", description: "The requested resource is available only through a proxy.", category: "Redirection", color: "bg-yellow-500" },
  { code: 307, title: "Temporary Redirect", description: "The target resource resides temporarily under a different URI and the user agent MUST NOT change the request method.", category: "Redirection", color: "bg-yellow-500" },
  { code: 308, title: "Permanent Redirect", description: "The target resource has been assigned a new permanent URI and any future references should use one of the returned URIs.", category: "Redirection", color: "bg-yellow-500" },

  // 4xx Client Error
  { code: 400, title: "Bad Request", description: "The server cannot or will not process the request due to an apparent client error.", category: "Client Error", color: "bg-orange-500" },
  { code: 401, title: "Unauthorized", description: "The request lacks valid authentication credentials for the target resource.", category: "Client Error", color: "bg-orange-500" },
  { code: 402, title: "Payment Required", description: "This response code is reserved for future use.", category: "Client Error", color: "bg-orange-500" },
  { code: 403, title: "Forbidden", description: "The server understood the request but refuses to authorize it.", category: "Client Error", color: "bg-orange-500" },
  { code: 404, title: "Not Found", description: "The origin server did not find a current representation for the target resource.", category: "Client Error", color: "bg-orange-500" },
  { code: 405, title: "Method Not Allowed", description: "The method received in the request-line is known by the origin server but not supported by the target resource.", category: "Client Error", color: "bg-orange-500" },
  { code: 406, title: "Not Acceptable", description: "The target resource does not have a current representation that would be acceptable to the user agent.", category: "Client Error", color: "bg-orange-500" },
  { code: 407, title: "Proxy Authentication Required", description: "The client must first authenticate itself with the proxy.", category: "Client Error", color: "bg-orange-500" },
  { code: 408, title: "Request Timeout", description: "The server timed out waiting for the request.", category: "Client Error", color: "bg-orange-500" },
  { code: 409, title: "Conflict", description: "The request conflicts with the current state of the server.", category: "Client Error", color: "bg-orange-500" },
  { code: 410, title: "Gone", description: "The target resource is no longer available at the origin server.", category: "Client Error", color: "bg-orange-500" },
  { code: 411, title: "Length Required", description: "The server refuses to accept the request without a defined Content-Length.", category: "Client Error", color: "bg-orange-500" },
  { code: 412, title: "Precondition Failed", description: "One or more conditions given in the request header fields evaluated to false.", category: "Client Error", color: "bg-orange-500" },
  { code: 413, title: "Payload Too Large", description: "The server is refusing to process a request because the request payload is larger than the server is willing or able to process.", category: "Client Error", color: "bg-orange-500" },
  { code: 414, title: "URI Too Long", description: "The server is refusing to service the request because the request-target is longer than the server is willing to interpret.", category: "Client Error", color: "bg-orange-500" },
  { code: 415, title: "Unsupported Media Type", description: "The origin server is refusing to service the request because the payload is in a format not supported.", category: "Client Error", color: "bg-orange-500" },
  { code: 416, title: "Range Not Satisfiable", description: "The range specified by the Range header field in the request can't be fulfilled.", category: "Client Error", color: "bg-orange-500" },
  { code: 417, title: "Expectation Failed", description: "The expectation given in the request's Expect header field could not be met by at least one of the inbound servers.", category: "Client Error", color: "bg-orange-500" },
  { code: 418, title: "I'm a teapot", description: "Any attempt to brew coffee with a teapot should result in the error code 418 I'm a teapot.", category: "Client Error", color: "bg-orange-500" },
  { code: 421, title: "Misdirected Request", description: "The request was directed at a server that is not able to produce a response.", category: "Client Error", color: "bg-orange-500" },
  { code: 422, title: "Unprocessable Entity", description: "The server understands the content type of the request entity and the syntax of the request entity is correct but was unable to process the contained instructions.", category: "Client Error", color: "bg-orange-500" },
  { code: 423, title: "Locked", description: "The source or destination resource of a method is locked.", category: "Client Error", color: "bg-orange-500" },
  { code: 424, title: "Failed Dependency", description: "The method could not be performed on the resource because the requested action depended on another action and that action failed.", category: "Client Error", color: "bg-orange-500" },
  { code: 425, title: "Too Early", description: "The server is unwilling to risk processing a request that might be replayed.", category: "Client Error", color: "bg-orange-500" },
  { code: 426, title: "Upgrade Required", description: "The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.", category: "Client Error", color: "bg-orange-500" },
  { code: 428, title: "Precondition Required", description: "The origin server requires the request to be conditional.", category: "Client Error", color: "bg-orange-500" },
  { code: 429, title: "Too Many Requests", description: "The user has sent too many requests in a given amount of time.", category: "Client Error", color: "bg-orange-500" },
  { code: 431, title: "Request Header Fields Too Large", description: "The server is unwilling to process the request because its header fields are too large.", category: "Client Error", color: "bg-orange-500" },
  { code: 451, title: "Unavailable For Legal Reasons", description: "The server is denying access to the resource as a consequence of a legal demand.", category: "Client Error", color: "bg-orange-500" },

  // 5xx Server Error
  { code: 500, title: "Internal Server Error", description: "The server has encountered a situation it doesn't know how to handle.", category: "Server Error", color: "bg-red-500" },
  { code: 501, title: "Not Implemented", description: "The request method is not supported by the server and cannot be handled.", category: "Server Error", color: "bg-red-500" },
  { code: 502, title: "Bad Gateway", description: "The server, while working as a gateway to get a response needed to handle the request, got an invalid response.", category: "Server Error", color: "bg-red-500" },
  { code: 503, title: "Service Unavailable", description: "The server is not ready to handle the request.", category: "Server Error", color: "bg-red-500" },
  { code: 504, title: "Gateway Timeout", description: "The server is acting as a gateway and cannot get a response in time.", category: "Server Error", color: "bg-red-500" },
  { code: 505, title: "HTTP Version Not Supported", description: "The HTTP version used in the request is not supported by the server.", category: "Server Error", color: "bg-red-500" },
  { code: 506, title: "Variant Also Negotiates", description: "The server has an internal configuration error.", category: "Server Error", color: "bg-red-500" },
  { code: 507, title: "Insufficient Storage", description: "The method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request.", category: "Server Error", color: "bg-red-500" },
  { code: 508, title: "Loop Detected", description: "The server detected an infinite loop while processing the request.", category: "Server Error", color: "bg-red-500" },
  { code: 510, title: "Not Extended", description: "Further extensions to the request are required for the server to fulfill it.", category: "Server Error", color: "bg-red-500" },
  { code: 511, title: "Network Authentication Required", description: "The client needs to authenticate to gain network access.", category: "Server Error", color: "bg-red-500" },
];

export function HttpStatusCodeReference() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(httpStatusCodes.map(code => code.category)))];

  const filteredCodes = useMemo(() => {
    return httpStatusCodes.filter(code => {
      const matchesSearch = code.code.toString().includes(searchTerm) ||
                           code.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           code.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || code.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Keyboard shortcuts
  useUtilKeyboardShortcuts({
    onClear: () => {
      setSearchTerm("");
      setSelectedCategory("All");
    },
  });

  return (
    <Card className="tool-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Globe className="h-5 w-5 text-dev-primary" />
          HTTP Status Code Reference
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, title, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer hover:bg-muted"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-1.5">
          {filteredCodes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No status codes found matching your search.
            </div>
          ) : (
            filteredCodes.map((statusCode) => (
              <div key={statusCode.code} className="flex items-start gap-3 px-3 py-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                <span className={`shrink-0 inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold text-white ${statusCode.color}`}>
                  {statusCode.code}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{statusCode.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{statusCode.description}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="text-xs text-muted-foreground text-center">
          Showing {filteredCodes.length} of {httpStatusCodes.length} status codes
        </div>
      </CardContent>
    </Card>
  );
}