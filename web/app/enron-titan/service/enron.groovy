def getEdgesForDate(vertexId, dateString, degrees) {
    current = g.v(vertexId)
    while(degrees > 0) {
        current = current.bothE(dateString)
        degrees--;
    }
    
    return current
}