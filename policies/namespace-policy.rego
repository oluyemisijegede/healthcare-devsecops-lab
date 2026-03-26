package main

# Deny namespaces without labels
deny[msg] {
  input.kind == "Namespace"
  not input.metadata.labels
  msg := sprintf("Namespace '%s' must have labels for identification and policy enforcement", [input.metadata.name])
}

# Deny deploying to the default namespace
deny[msg] {
  input.kind == "Deployment"
  input.metadata.namespace == "default"
  msg := "Deployments must not use the 'default' namespace — use a dedicated namespace"
}
